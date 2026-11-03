/**
 * Kindora dev-only MongoDB wire-protocol server.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Kindora API is written against the real MongoDB Node driver and Better
 * Auth's MongoDB adapter. In constrained environments (CI sandboxes) a real
 * mongod binary cannot be downloaded, so this tool implements enough of the
 * MongoDB wire protocol (OP_MSG / OP_QUERY) for the official driver to connect
 * and run the full application. Queries, updates and aggregations are executed
 * by `mingo` — a faithful, widely used JavaScript implementation of the MongoDB
 * query language. Data is persisted to disk as EJSON.
 *
 * It is NOT part of the production deployment. In production, set MONGODB_URI
 * to a MongoDB Atlas connection string and never run this tool.
 */
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { BSON, EJSON } from "bson";
import { Query, aggregate, update as applyUpdate } from "mingo";

const PORT = Number(process.env.DEV_MONGO_PORT || 27017);
const HOST = process.env.DEV_MONGO_HOST || "127.0.0.1";
const DATA_DIR = process.env.DEV_MONGO_DATA_DIR || path.resolve(process.cwd(), ".data/dev-mongo");

fs.mkdirSync(DATA_DIR, { recursive: true });

/** @type {Map<string, Map<string, {docs: any[], indexes: any[]}>>} db -> collection -> store */
const databases = new Map();
const dirtyDbs = new Set();
let flushTimer = null;

function getCollection(dbName, collName, create = true) {
  let db = databases.get(dbName);
  if (!db) {
    if (!create) return null;
    db = new Map();
    databases.set(dbName, db);
  }
  let coll = db.get(collName);
  if (!coll) {
    if (!create) return null;
    coll = { docs: [], indexes: [{ v: 2, key: { _id: 1 }, name: "_id_" }] };
    db.set(collName, coll);
  }
  return coll;
}

function dbFile(dbName) {
  return path.join(DATA_DIR, `${encodeURIComponent(dbName)}.json`);
}

function loadDatabases() {
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
      const db = new Map();
      for (const [collName, store] of Object.entries(raw)) {
        db.set(collName, {
          docs: store.docs.map((d) => EJSON.parse(JSON.stringify(d))),
          indexes: store.indexes,
        });
      }
      databases.set(decodeURIComponent(file.replace(/\.json$/, "")), db);
    } catch (err) {
      console.error(`[dev-mongo] failed to load ${file}:`, err.message);
    }
  }
}

function markDirty(dbName) {
  dirtyDbs.add(dbName);
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 200);
}

function flush() {
  flushTimer = null;
  for (const dbName of dirtyDbs) {
    const db = databases.get(dbName);
    if (!db) continue;
    const out = {};
    for (const [collName, store] of db) {
      out[collName] = {
        docs: store.docs.map((d) => EJSON.serialize(d)),
        indexes: store.indexes,
      };
    }
    const file = dbFile(dbName);
    fs.writeFileSync(file + ".tmp", JSON.stringify(out));
    fs.renameSync(file + ".tmp", file);
  }
  dirtyDbs.clear();
}

loadDatabases();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const { ObjectId } = BSON;

function clone(doc) {
  return EJSON.deserialize(EJSON.serialize(doc));
}

function keyString(value) {
  return EJSON.stringify(value ?? null);
}

function getNested(doc, keyPath) {
  return keyPath.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), doc);
}

function uniqueViolation(coll, doc, ignoreDoc) {
  for (const index of coll.indexes) {
    if (!index.unique) continue;
    const keys = Object.keys(index.key);
    const candidate = keyString(keys.map((k) => getNested(doc, k)));
    for (const other of coll.docs) {
      if (other === ignoreDoc) continue;
      const existing = keyString(keys.map((k) => getNested(other, k)));
      if (candidate === existing) {
        return `E11000 duplicate key error collection: index: ${index.name} dup key: ${candidate}`;
      }
    }
  }
  return null;
}

function extractEquality(filter, target = {}) {
  for (const [k, v] of Object.entries(filter || {})) {
    if (k.startsWith("$")) continue;
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof ObjectId) && !(v instanceof Date) && Object.keys(v).some((x) => x.startsWith("$"))) continue;
    if (k.includes(".")) {
      const parts = k.split(".");
      let cur = target;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] && typeof cur[parts[i]] === "object" ? cur[parts[i]] : {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = v;
    } else {
      target[k] = v;
    }
  }
  return target;
}

function stripSetOnInsert(updateExpr) {
  if (!updateExpr || typeof updateExpr !== "object") return updateExpr;
  const copy = { ...updateExpr };
  delete copy.$setOnInsert;
  return copy;
}

function isOperatorUpdate(u) {
  return u && typeof u === "object" && Object.keys(u).some((k) => k.startsWith("$"));
}

function applyUpdateToDoc(doc, updateExpr, { upsertInserted = false } = {}) {
  if (Array.isArray(updateExpr)) {
    // Pipeline-style update: run as aggregation producing one document.
    const [result] = aggregate([clone(doc)], updateExpr);
    const id = doc._id;
    for (const k of Object.keys(doc)) delete doc[k];
    Object.assign(doc, result || {});
    doc._id = id;
    return;
  }
  if (isOperatorUpdate(updateExpr)) {
    let expr = updateExpr;
    if (upsertInserted && updateExpr.$setOnInsert) {
      applyUpdate(doc, { $set: updateExpr.$setOnInsert });
      expr = stripSetOnInsert(updateExpr);
    } else {
      expr = stripSetOnInsert(updateExpr);
    }
    if (Object.keys(expr).length > 0) applyUpdate(doc, expr);
  } else {
    const id = doc._id;
    for (const k of Object.keys(doc)) delete doc[k];
    Object.assign(doc, updateExpr);
    doc._id = id;
  }
}

function cursorReply(dbName, collName, docs) {
  return {
    cursor: { firstBatch: docs, id: BSON.Long.fromNumber(0), ns: `${dbName}.${collName}` },
    ok: 1,
  };
}

function ok(extra = {}) {
  return { ok: 1, ...extra };
}

/* ------------------------------------------------------------------ */
/* Command execution                                                   */
/* ------------------------------------------------------------------ */

function executeCommand(cmd) {
  const name = Object.keys(cmd)[0];
  const lower = name.toLowerCase();
  const dbName = cmd.$db || "test";

  switch (lower) {
    case "hello":
    case "ismaster": {
      return ok({
        isWritablePrimary: true,
        ismaster: true,
        secondary: false,
        topologyVersion: undefined,
        maxBsonObjectSize: 16 * 1024 * 1024,
        maxMessageSizeBytes: 48 * 1000 * 1000,
        maxWriteBatchSize: 100000,
        localTime: new Date(),
        logicalSessionTimeoutMinutes: 30,
        connectionId: 1,
        minWireVersion: 0,
        maxWireVersion: 21,
        readOnly: false,
        compression: [],
        msg: "kindora-dev-mongo",
      });
    }
    case "ping":
      return ok();
    case "buildinfo": {
      return ok({
        version: "6.0.14",
        versionArray: [6, 0, 14, 0],
        gitVersion: "kindora-dev-mongo",
        modules: [],
        allocator: "system",
        javascriptEngine: "none",
        sysInfo: "deprecated",
        openssl: {},
        buildEnvironment: {},
        bits: 64,
        debug: false,
        maxBsonObjectSize: 16 * 1024 * 1024,
      });
    }
    case "getlasterror":
      return ok({ n: 0 });
    case "insert": {
      const coll = getCollection(dbName, cmd.insert);
      const documents = cmd.documents || [];
      let n = 0;
      const writeErrors = [];
      documents.forEach((doc, index) => {
        if (doc._id === undefined) doc._id = new ObjectId();
        const dupId = coll.docs.find((d) => keyString(d._id) === keyString(doc._id));
        const violation = dupId
          ? `E11000 duplicate key error collection: ${dbName}.${cmd.insert} index: _id_ dup key: ${keyString(doc._id)}`
          : uniqueViolation(coll, doc);
        if (violation) {
          writeErrors.push({ index, code: 11000, errmsg: violation });
          return;
        }
        coll.docs.push(clone(doc));
        n++;
      });
      if (n > 0) markDirty(dbName);
      return ok({ n, ...(writeErrors.length ? { writeErrors } : {}) });
    }
    case "update": {
      const coll = getCollection(dbName, cmd.update);
      let n = 0;
      let nModified = 0;
      const upserted = [];
      const writeErrors = [];
      (cmd.updates || []).forEach((op, index) => {
        const query = new Query(op.q || {});
        const matches = coll.docs.filter((d) => query.test(d));
        const targets = op.multi ? matches : matches.slice(0, 1);
        if (targets.length === 0 && op.upsert) {
          const base = extractEquality(op.q || {});
          if (base._id === undefined) base._id = new ObjectId();
          const doc = clone(base);
          try {
            applyUpdateToDoc(doc, op.u, { upsertInserted: true });
            const violation = uniqueViolation(coll, doc);
            if (violation) {
              writeErrors.push({ index, code: 11000, errmsg: violation });
              return;
            }
            coll.docs.push(doc);
            upserted.push({ index, _id: doc._id });
            n++;
          } catch (err) {
            writeErrors.push({ index, code: 2, errmsg: err.message });
          }
          return;
        }
        for (const doc of targets) {
          const before = keyString(doc);
          const candidate = clone(doc);
          try {
            applyUpdateToDoc(candidate, op.u);
            const violation = uniqueViolation(coll, candidate, doc);
            if (violation) {
              writeErrors.push({ index, code: 11000, errmsg: violation });
              continue;
            }
          } catch (err) {
            writeErrors.push({ index, code: 2, errmsg: err.message });
            continue;
          }
          Object.assign(doc, candidate);
          n++;
          if (keyString(doc) !== before) nModified++;
        }
      });
      if (n > 0) markDirty(dbName);
      return ok({ n, nModified, ...(upserted.length ? { upserted } : {}), ...(writeErrors.length ? { writeErrors } : {}) });
    }
    case "delete": {
      const coll = getCollection(dbName, cmd.delete);
      let n = 0;
      for (const op of cmd.deletes || []) {
        const query = new Query(op.q || {});
        const limit = op.limit === 0 ? Infinity : op.limit || 1;
        const toRemove = [];
        for (const doc of coll.docs) {
          if (toRemove.length >= limit) break;
          if (query.test(doc)) toRemove.push(doc);
        }
        coll.docs = coll.docs.filter((d) => !toRemove.includes(d));
        n += toRemove.length;
      }
      if (n > 0) markDirty(dbName);
      return ok({ n });
    }
    case "find": {
      const coll = getCollection(dbName, cmd.find, false);
      const docs = coll ? coll.docs : [];
      let cursor = new Query(cmd.filter || {}).find(docs, cmd.projection || {});
      if (cmd.sort) cursor = cursor.sort(cmd.sort);
      if (cmd.skip) cursor = cursor.skip(cmd.skip);
      if (cmd.limit) cursor = cursor.limit(Math.abs(cmd.limit));
      return cursorReply(dbName, cmd.find, cursor.all());
    }
    case "count": {
      const coll = getCollection(dbName, cmd.count, false);
      const docs = coll ? coll.docs : [];
      const n = new Query(cmd.query || {}).find(docs).count();
      return ok({ n });
    }
    case "distinct": {
      const coll = getCollection(dbName, cmd.distinct, false);
      const docs = coll ? new Query(cmd.query || {}).find(coll.docs).all() : [];
      const seen = new Set();
      const values = [];
      for (const doc of docs) {
        const v = getNested(doc, cmd.key);
        const flat = Array.isArray(v) ? v : [v];
        for (const item of flat) {
          if (item === undefined) continue;
          const k = keyString(item);
          if (!seen.has(k)) {
            seen.add(k);
            values.push(item);
          }
        }
      }
      return ok({ values });
    }
    case "aggregate": {
      const collName = cmd.aggregate;
      const pipeline = cmd.pipeline || [];
      if (collName === 1 || collName === "1") {
        // Database-level aggregation (e.g. $listLocalSessions) — not needed.
        return cursorReply(dbName, "$cmd.aggregate", []);
      }
      const coll = getCollection(dbName, collName, false);
      const docs = coll ? coll.docs : [];
      const result = aggregate(docs, pipeline);
      return cursorReply(dbName, collName, result);
    }
    case "findandmodify": {
      const collName = cmd.findAndModify ?? cmd.findandmodify;
      const coll = getCollection(dbName, collName);
      let cursor = new Query(cmd.query || {}).find(coll.docs);
      if (cmd.sort) cursor = cursor.sort(cmd.sort);
      const matches = cursor.all();
      const target = matches[0];
      const lastErrorObject = { n: 0, updatedExisting: false };
      let value = null;
      if (cmd.remove) {
        if (target) {
          coll.docs = coll.docs.filter((d) => d !== target);
          markDirty(dbName);
          lastErrorObject.n = 1;
          value = target;
        }
      } else if (target) {
        const before = clone(target);
        applyUpdateToDoc(target, cmd.update);
        markDirty(dbName);
        lastErrorObject.n = 1;
        lastErrorObject.updatedExisting = true;
        value = cmd.new ? target : before;
      } else if (cmd.upsert) {
        const base = extractEquality(cmd.query || {});
        if (base._id === undefined) base._id = new ObjectId();
        const doc = clone(base);
        applyUpdateToDoc(doc, cmd.update, { upsertInserted: true });
        coll.docs.push(doc);
        markDirty(dbName);
        lastErrorObject.n = 1;
        lastErrorObject.upserted = doc._id;
        value = cmd.new ? doc : null;
      }
      if (cmd.fields && value) {
        value = new Query({}).find([value], cmd.fields).all()[0];
      }
      return ok({ lastErrorObject, value });
    }
    case "createindexes": {
      const coll = getCollection(dbName, cmd.createIndexes);
      let added = 0;
      for (const spec of cmd.indexes || []) {
        const existing = coll.indexes.find((i) => i.name === spec.name);
        if (existing) continue;
        if (spec.unique) {
          const keys = Object.keys(spec.key);
          const seen = new Set();
          for (const doc of coll.docs) {
            const k = keyString(keys.map((key) => getNested(doc, key)));
            if (seen.has(k)) {
              return { ok: 0, code: 11000, errmsg: `E11000 duplicate key error while building index ${spec.name}` };
            }
            seen.add(k);
          }
        }
        coll.indexes.push({ v: 2, ...spec });
        added++;
      }
      if (added) markDirty(dbName);
      return ok({
        createdCollectionAutomatically: false,
        numIndexesBefore: coll.indexes.length - added,
        numIndexesAfter: coll.indexes.length,
      });
    }
    case "listindexes": {
      const coll = getCollection(dbName, cmd.listIndexes, false);
      const indexes = coll ? coll.indexes.map((i) => ({ ...i, ns: `${dbName}.${cmd.listIndexes}` })) : [];
      return cursorReply(dbName, cmd.listIndexes, indexes);
    }
    case "drop": {
      const db = databases.get(dbName);
      if (!db || !db.has(cmd.drop)) return { ok: 0, code: 26, errmsg: "ns not found" };
      db.delete(cmd.drop);
      markDirty(dbName);
      return ok();
    }
    case "dropdatabase": {
      databases.delete(dbName);
      try { fs.unlinkSync(dbFile(dbName)); } catch {}
      return ok({ dropped: dbName });
    }
    case "listcollections": {
      const db = databases.get(dbName);
      const names = db ? [...db.keys()] : [];
      return cursorReply(dbName, "$cmd.listCollections", names.map((n) => ({ name: n, type: "collection" })));
    }
    case "getmore": {
      const collName = String(cmd.getMore);
      return cursorReply(dbName, collName, []);
    }
    case "killcursors":
      return ok({ cursorsKilled: [], cursorsNotFound: cmd.cursors || [], cursorsAlive: [], cursorsUnknown: [] });
    case "endsessions":
    case "refreshsessions":
    case "committransaction":
    case "aborttransaction":
      return ok();
    case "setparameter":
    case "getparameter":
      return ok();
    default: {
      console.warn(`[dev-mongo] unhandled command: ${name}`);
      return ok();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Wire protocol                                                       */
/* ------------------------------------------------------------------ */

const OP_REPLY = 1;
const OP_QUERY = 2004;
const OP_MSG = 2013;

function encodeMsg(responseTo, doc) {
  const body = BSON.serialize(doc);
  const total = 16 + 4 + 1 + body.length;
  const buf = Buffer.alloc(total);
  let o = 0;
  buf.writeInt32LE(total, o); o += 4;
  buf.writeInt32LE(1, o); o += 4;
  buf.writeInt32LE(responseTo, o); o += 4;
  buf.writeInt32LE(OP_MSG, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4; // flagBits
  buf.writeUInt8(0, o); o += 1; // section kind 0
  body.copy(buf, o);
  return buf;
}

function encodeReply(responseTo, doc) {
  const body = BSON.serialize(doc);
  const total = 16 + 20 + body.length;
  const buf = Buffer.alloc(total);
  let o = 0;
  buf.writeInt32LE(total, o); o += 4;
  buf.writeInt32LE(1, o); o += 4;
  buf.writeInt32LE(responseTo, o); o += 4;
  buf.writeInt32LE(OP_REPLY, o); o += 4;
  buf.writeInt32LE(0, o); o += 4; // responseFlags
  buf.writeBigInt64LE(0n, o); o += 8; // cursorID
  buf.writeInt32LE(0, o); o += 4; // startingFrom
  buf.writeInt32LE(1, o); o += 4; // numberReturned
  body.copy(buf, o);
  return buf;
}

function readCString(buf, offset) {
  const end = buf.indexOf(0, offset);
  return [buf.toString("utf8", offset, end), end + 1];
}

function parseOpMsg(payload) {
  let o = 0;
  const flags = payload.readUInt32LE(o); o += 4;
  const hasChecksum = (flags & 1) !== 0;
  const end = hasChecksum ? payload.length - 4 : payload.length;
  let body = null;
  const sequences = {};
  while (o < end) {
    const kind = payload.readUInt8(o); o += 1;
    if (kind === 0) {
      const size = payload.readInt32LE(o);
      body = BSON.deserialize(payload.subarray(o, o + size));
      o += size;
    } else if (kind === 1) {
      const size = payload.readInt32LE(o);
      const sectionEnd = o + size;
      let p = o + 4;
      let identifier;
      [identifier, p] = readCString(payload, p);
      const docs = [];
      while (p < sectionEnd) {
        const docSize = payload.readInt32LE(p);
        docs.push(BSON.deserialize(payload.subarray(p, p + docSize)));
        p += docSize;
      }
      sequences[identifier] = docs;
      o = sectionEnd;
    } else {
      throw new Error(`unknown OP_MSG section kind ${kind}`);
    }
  }
  return { ...body, ...sequences };
}

function parseOpQuery(payload) {
  let o = 0;
  o += 4; // flags
  let collName;
  [collName, o] = readCString(payload, o);
  o += 4; // numberToSkip
  o += 4; // numberToReturn
  const size = payload.readInt32LE(o);
  let query = BSON.deserialize(payload.subarray(o, o + size));
  if (query.$query) query = query.$query;
  return { query, collName };
}

let connectionCounter = 0;

const server = net.createServer((socket) => {
  const connId = ++connectionCounter;
  let buffer = Buffer.alloc(0);
  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 16) {
      const messageLength = buffer.readInt32LE(0);
      if (buffer.length < messageLength) break;
      const requestId = buffer.readInt32LE(4);
      const opCode = buffer.readInt32LE(12);
      const payload = buffer.subarray(16, messageLength);
      buffer = buffer.subarray(messageLength);
      try {
        if (opCode === OP_MSG) {
          const cmd = parseOpMsg(payload);
          const reply = executeCommand(cmd);
          socket.write(encodeMsg(requestId, reply));
        } else if (opCode === OP_QUERY) {
          const { query } = parseOpQuery(payload);
          const reply = executeCommand(query);
          socket.write(encodeReply(requestId, reply));
        } else {
          console.warn(`[dev-mongo] unsupported opcode ${opCode}`);
          socket.write(encodeMsg(requestId, { ok: 0, errmsg: `unsupported opcode ${opCode}` }));
        }
      } catch (err) {
        console.error(`[dev-mongo] conn ${connId} error:`, err);
        try {
          socket.write(encodeMsg(requestId, { ok: 0, code: 2, errmsg: err.message }));
        } catch {}
      }
    }
  });
  socket.on("error", () => {});
});

process.on("SIGINT", () => { flush(); process.exit(0); });
process.on("SIGTERM", () => { flush(); process.exit(0); });
process.on("exit", () => { try { flush(); } catch {} });

server.listen(PORT, HOST, () => {
  console.log(`[dev-mongo] MongoDB-compatible dev server listening on mongodb://${HOST}:${PORT}`);
  console.log(`[dev-mongo] data directory: ${DATA_DIR}`);
  console.log("[dev-mongo] development only — use MongoDB Atlas in production");
});
