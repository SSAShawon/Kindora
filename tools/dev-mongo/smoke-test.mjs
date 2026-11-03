/** Smoke test: real MongoDB driver against the dev wire-protocol server. */
import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb://127.0.0.1:27017/kindora_smoke?directConnection=true";
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ok -", msg);
}

try {
  await client.connect();
  const db = client.db("kindora_smoke");
  await db.collection("t").deleteMany({});

  // insert + findOne with ObjectId
  const id = new ObjectId();
  await db.collection("t").insertOne({ _id: id, name: "alpha", n: 1, when: new Date() });
  const found = await db.collection("t").findOne({ _id: id });
  assert(found?.name === "alpha", "findOne by ObjectId");

  // string _id (Better Auth style)
  await db.collection("t").insertOne({ _id: "abc123", name: "beta", n: 5 });
  const beta = await db.collection("t").findOne({ _id: "abc123" });
  assert(beta?.n === 5, "findOne by string id");

  // update $set / $inc
  await db.collection("t").updateOne({ _id: id }, { $set: { name: "alpha2" }, $inc: { n: 2 } });
  const updated = await db.collection("t").findOne({ _id: id });
  assert(updated?.name === "alpha2" && updated?.n === 3, "updateOne $set + $inc");

  // upsert
  await db.collection("t").updateOne({ key: "gamma" }, { $set: { n: 9 }, $setOnInsert: { created: true } }, { upsert: true });
  const gamma = await db.collection("t").findOne({ key: "gamma" });
  assert(gamma?.n === 9 && gamma?.created === true, "upsert with $setOnInsert");

  // regex search + sort + pagination
  await db.collection("t").insertMany([
    { name: "Khulna cleanup", n: 2 },
    { name: "Dhaka plantation", n: 7 },
  ]);
  const rx = await db.collection("t").find({ name: { $regex: "khulna", $options: "i" } }).toArray();
  assert(rx.length === 1 && rx[0].name === "Khulna cleanup", "case-insensitive regex");
  const sorted = await db.collection("t").find({}).sort({ n: -1 }).skip(1).limit(2).toArray();
  assert(sorted.length === 2 && sorted[0].n === 7, "sort + skip + limit");

  // countDocuments
  const count = await db.collection("t").countDocuments({});
  assert(count === 5, "countDocuments");

  // unique index + duplicate error
  await db.collection("u").deleteMany({});
  await db.collection("u").createIndex({ eventId: 1, userId: 1 }, { unique: true });
  await db.collection("u").insertOne({ eventId: "e1", userId: "u1" });
  let dupCode = 0;
  try {
    await db.collection("u").insertOne({ eventId: "e1", userId: "u1" });
  } catch (err) {
    dupCode = err.code;
  }
  assert(dupCode === 11000, "unique index duplicate -> 11000");

  // aggregation
  const agg = await db.collection("t").aggregate([{ $group: { _id: null, total: { $sum: "$n" } } }]).toArray();
  assert(agg[0]?.total === 26, "aggregate $group $sum");

  // distinct
  const distinct = await db.collection("t").distinct("name");
  assert(distinct.length === 4, "distinct");

  // findOneAndUpdate (findAndModify)
  const fam = await db.collection("t").findOneAndUpdate({ _id: "abc123" }, { $inc: { n: 1 } }, { returnDocument: "after" });
  assert(fam?.n === 6, "findOneAndUpdate returnDocument after");

  // deleteMany
  const del = await db.collection("t").deleteMany({ n: { $gte: 5 } });
  assert(del.deletedCount === 3, "deleteMany with $gte");

  // $in with mixed ids
  const inQ = await db.collection("t").find({ _id: { $in: [id, "abc123"] } }).toArray();
  assert(inQ.length === 1, "$in mixed ObjectId/string");

  await db.dropDatabase();
  console.log("\nALL SMOKE TESTS PASSED");
  process.exit(0);
} catch (err) {
  console.error("\nSMOKE TEST FAILED:", err);
  process.exit(1);
}
