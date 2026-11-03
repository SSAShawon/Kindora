/**
 * End-to-end API test suite. Run against a live local API:
 *   node scripts/api-test.mjs [baseUrl]
 * Exercises auth, sessions, roles, ownership, joins, validation and stats.
 */
const BASE = process.argv[2] ?? "http://127.0.0.1:5000";
let passed = 0;
let failed = 0;

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ok - ${name}`);
  } else {
    failed++;
    console.error(`  FAIL - ${name} ${extra}`);
  }
}

class Jar {
  constructor() {
    this.cookies = new Map();
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  store(res) {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const idx = pair.indexOf("=");
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (value === "" || /Expires=Thu, 01 Jan 1970/i.test(raw)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  async fetch(path, options = {}) {
    const res = await fetch(BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        ...(this.cookies.size ? { Cookie: this.header() } : {}),
        ...(options.headers ?? {}),
      },
    });
    this.store(res);
    let body = null;
    try {
      body = await res.json();
    } catch {}
    return { status: res.status, body };
  }
}

const stamp = Date.now();
const volunteer = new Jar();
const organizer = new Jar();
const otherOrganizer = new Jar();
const anon = new Jar();

console.log("== health / config / stats ==");
{
  const health = await anon.fetch("/api/health");
  check("health", health.status === 200 && health.body?.data?.status === "ok");
  const config = await anon.fetch("/api/config");
  check("public config", config.status === 200 && typeof config.body?.data?.googleAuthEnabled === "boolean");
  const stats = await anon.fetch("/api/stats");
  check(
    "stats from db",
    stats.status === 200 && stats.body?.data?.volunteers >= 4 && stats.body?.data?.events >= 12,
    JSON.stringify(stats.body),
  );
}

console.log("== events listing ==");
let plantationId = null;
let pastEventId = null;
{
  const all = await anon.fetch("/api/events?limit=24");
  check("list upcoming", all.status === 200 && all.body?.data?.events?.length >= 9, JSON.stringify(all.body).slice(0, 200));
  const search = await anon.fetch("/api/events?search=Khulna&category=Plantation");
  const events = search.body?.data?.events ?? [];
  check(
    "combined search + category",
    search.status === 200 && events.length >= 1 && events.every((e) => e.eventType === "Plantation" && /khulna/i.test(e.location)),
    JSON.stringify(events.map((e) => [e.title, e.eventType, e.location])),
  );
  plantationId = events[0]?.id;
  const byOrganizer = await anon.fetch("/api/events?search=Tanvir");
  check("search by organizer name", (byOrganizer.body?.data?.events ?? []).length >= 1);
  const featured = await anon.fetch("/api/events/featured");
  check("featured", featured.status === 200 && featured.body?.data?.events?.length === 3);
  const past = await anon.fetch("/api/events?status=past");
  check("past events", (past.body?.data?.events ?? []).length >= 3);
  pastEventId = past.body?.data?.events?.[0]?.id;
  const none = await anon.fetch("/api/events?search=zzzz-no-match-zzzz");
  check("empty search result", none.status === 200 && none.body?.data?.total === 0);
  const detail = await anon.fetch(`/api/events/${plantationId}`);
  check(
    "event detail + organizer",
    detail.status === 200 && detail.body?.data?.event?.id === plantationId && Boolean(detail.body?.data?.organizer?.name),
  );
  const participants = await anon.fetch(`/api/events/${plantationId}/participants`);
  const plist = participants.body?.data?.participants ?? [];
  check(
    "participants privacy (no emails)",
    participants.status === 200 && plist.length >= 1 && plist.every((p) => p.name && !("email" in p)),
  );
  const missing = await anon.fetch("/api/events/000000000000000000000000");
  check("404 for missing event", missing.status === 404);
}

console.log("== auth ==");
const volEmail = `test.vol.${stamp}@example.com`;
const orgEmail = `test.org.${stamp}@example.com`;
const org2Email = `test.org2.${stamp}@example.com`;
{
  const weak = await anon.fetch("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name: "Weak", email: `weak.${stamp}@example.com`, password: "short" }),
  });
  check("reject short password", weak.status >= 400);

  const signup = await volunteer.fetch("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name: "Test Volunteer", email: volEmail, password: "Str0ng!Pass", role: "volunteer" }),
  });
  check("volunteer signup", signup.status === 200 && signup.body?.user?.email === volEmail, JSON.stringify(signup.body).slice(0, 300));

  const dup = await anon.fetch("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name: "Dup", email: volEmail, password: "Str0ng!Pass" }),
  });
  check("duplicate email prevented", dup.status >= 400);

  const session = await volunteer.fetch("/api/auth/get-session");
  check("session persists (cookie)", session.status === 200 && session.body?.user?.email === volEmail, JSON.stringify(session.body).slice(0, 200));
  check("role stored", session.body?.user?.role === "volunteer");

  const badLogin = await anon.fetch("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email: volEmail, password: "WrongPassword1!" }),
  });
  check("wrong password rejected", badLogin.status === 401);

  const orgSignup = await organizer.fetch("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name: "Test Organizer", email: orgEmail, password: "Str0ng!Pass", role: "organizer" }),
  });
  check("organizer signup", orgSignup.status === 200);
  const org2Signup = await otherOrganizer.fetch("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name: "Other Organizer", email: org2Email, password: "Str0ng!Pass", role: "organizer" }),
  });
  check("second organizer signup", org2Signup.status === 200);

  const sneaky = new Jar();
  const escalation = await sneaky.fetch("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ name: "Sneaky", email: `sneaky.${stamp}@example.com`, password: "Str0ng!Pass", role: "superadmin" }),
  });
  check("invalid role sanitized to volunteer", escalation.status === 200 && escalation.body?.user?.role === "volunteer", JSON.stringify(escalation.body?.user ?? {}).slice(0, 200));
}

console.log("== authorization ==");
{
  const unauth = await anon.fetch("/api/events", { method: "POST", body: JSON.stringify({}) });
  check("unauthenticated create -> 401", unauth.status === 401);
  const volCreate = await volunteer.fetch("/api/events", {
    method: "POST",
    body: JSON.stringify({
      title: "Volunteer Attempt",
      description: "This should be rejected because volunteers cannot create events.",
      eventType: "Other",
      thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      location: "Khulna",
      eventDate: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  check("volunteer create -> 403", volCreate.status === 403);
  const orgJoin = await organizer.fetch(`/api/events/${plantationId}/join`, { method: "POST" });
  check("organizer join -> 403", orgJoin.status === 403);
}

console.log("== organizer event lifecycle ==");
let createdId = null;
{
  const invalid = await organizer.fetch("/api/events", {
    method: "POST",
    body: JSON.stringify({
      title: "Bad",
      description: "too short",
      eventType: "NotACategory",
      thumbnail: "javascript:alert(1)",
      location: "X",
      eventDate: "2020-01-01T00:00:00Z",
    }),
  });
  check("invalid event -> 400 with details", invalid.status === 400 && invalid.body?.error?.details, JSON.stringify(invalid.body).slice(0, 300));

  const create = await organizer.fetch("/api/events", {
    method: "POST",
    body: JSON.stringify({
      title: "API Test Beach Cleanup",
      description: "A test event created by the automated API test suite to verify the full lifecycle.",
      eventType: "Cleanup",
      thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
      location: "Test Beach, Khulna",
      eventDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    }),
  });
  createdId = create.body?.data?.event?.id;
  check("organizer create -> 201", create.status === 201 && Boolean(createdId), JSON.stringify(create.body).slice(0, 300));

  const editOther = await otherOrganizer.fetch(`/api/events/${createdId}`, {
    method: "PUT",
    body: JSON.stringify({
      title: "Hijacked Title",
      description: "Another organizer tries to edit an event they do not own — must fail.",
      eventType: "Cleanup",
      thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      location: "Hijacked",
      eventDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    }),
  });
  check("edit someone else's event -> 403", editOther.status === 403);

  const delOther = await otherOrganizer.fetch(`/api/events/${createdId}`, { method: "DELETE" });
  check("delete someone else's event -> 403", delOther.status === 403);

  const edit = await organizer.fetch(`/api/events/${createdId}`, {
    method: "PUT",
    body: JSON.stringify({
      title: "API Test Beach Cleanup (Updated)",
      description: "Updated description verifying the edit flow works end to end for the owner.",
      eventType: "Cleanup",
      thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
      location: "Test Beach, Khulna",
      eventDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    }),
  });
  check("owner edit -> 200", edit.status === 200 && edit.body?.data?.event?.title?.includes("(Updated)"));

  const pastDate = await organizer.fetch(`/api/events/${createdId}`, {
    method: "PUT",
    body: JSON.stringify({
      title: "API Test Beach Cleanup (Updated)",
      description: "Trying to move the event into the past must be rejected by the API.",
      eventType: "Cleanup",
      thumbnail: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      location: "Test Beach, Khulna",
      eventDate: "2020-01-01T00:00:00Z",
    }),
  });
  check("reschedule to past -> 400", pastDate.status === 400);
}

console.log("== participation ==");
{
  const join = await volunteer.fetch(`/api/events/${createdId}/join`, { method: "POST" });
  check("volunteer join -> 201", join.status === 201 && join.body?.data?.participantCount === 1, JSON.stringify(join.body).slice(0, 200));

  const dup = await volunteer.fetch(`/api/events/${createdId}/join`, { method: "POST" });
  check("duplicate join -> 409", dup.status === 409);

  const detail = await volunteer.fetch(`/api/events/${createdId}`);
  check("viewerJoined reflected", detail.body?.data?.viewerJoined === true);

  const plist = await anon.fetch(`/api/events/${createdId}/participants`);
  check("participant listed", plist.body?.data?.participants?.some((p) => p.name === "Test Volunteer"));

  const joined = await volunteer.fetch("/api/users/me/joined-events");
  check("joined-events endpoint", joined.status === 200 && joined.body?.data?.items?.some((i) => i.event.id === createdId));

  const pastJoin = await volunteer.fetch(`/api/events/${pastEventId}/join`, { method: "POST" });
  check("join past event -> 400", pastJoin.status === 400);

  const cancel = await volunteer.fetch(`/api/events/${createdId}/join`, { method: "DELETE" });
  check("cancel participation", cancel.status === 200 && cancel.body?.data?.participantCount === 0);

  const cancelAgain = await volunteer.fetch(`/api/events/${createdId}/join`, { method: "DELETE" });
  check("cancel when not joined -> 404", cancelAgain.status === 404);

  await volunteer.fetch(`/api/events/${createdId}/join`, { method: "POST" });
}

console.log("== users / profile / dashboards ==");
{
  const me = await volunteer.fetch("/api/users/me");
  check("users/me", me.status === 200 && me.body?.data?.user?.email === volEmail && me.body?.data?.user?.role === "volunteer");

  const upd = await volunteer.fetch("/api/users/me/profile", {
    method: "PUT",
    body: JSON.stringify({ name: "Test Volunteer Renamed", image: "" }),
  });
  check("profile update", upd.status === 200 && upd.body?.data?.user?.name === "Test Volunteer Renamed");

  const escalate = await volunteer.fetch("/api/auth/update-user", {
    method: "POST",
    body: JSON.stringify({ name: "Test Volunteer Renamed", role: "organizer" }),
  });
  const sessionAfter = await volunteer.fetch("/api/auth/get-session");
  check(
    "role escalation via update-user blocked",
    escalate.status === 400 && sessionAfter.body?.user?.role === "volunteer",
    JSON.stringify({ escalate: escalate.status, role: sessionAfter.body?.user?.role }),
  );

  const volStats = await volunteer.fetch("/api/users/me/stats");
  check(
    "volunteer dashboard stats",
    volStats.status === 200 && volStats.body?.data?.role === "volunteer" && volStats.body?.data?.stats?.joinedTotal >= 1,
    JSON.stringify(volStats.body).slice(0, 200),
  );

  const orgStats = await organizer.fetch("/api/users/me/stats");
  check(
    "organizer dashboard stats",
    orgStats.status === 200 && orgStats.body?.data?.role === "organizer" && orgStats.body?.data?.stats?.createdTotal >= 1 && orgStats.body?.data?.stats?.totalParticipants >= 1,
    JSON.stringify(orgStats.body).slice(0, 300),
  );

  const created = await organizer.fetch("/api/users/me/created-events");
  check("created-events endpoint", created.status === 200 && created.body?.data?.events?.some((e) => e.id === createdId));

  const volCreated = await volunteer.fetch("/api/users/me/created-events");
  check("volunteer created-events -> 403", volCreated.status === 403);
}

console.log("== contact / cleanup ==");
{
  const bad = await anon.fetch("/api/contact", { method: "POST", body: JSON.stringify({ name: "A", email: "nope", subject: "x", message: "short" }) });
  check("invalid contact -> 400", bad.status === 400);
  const ok = await anon.fetch("/api/contact", {
    method: "POST",
    body: JSON.stringify({ name: "API Test", email: "apitest@example.com", subject: "Testing contact", message: "This is a test message from the automated API test suite." }),
  });
  check("contact stored -> 201", ok.status === 201);

  const del = await organizer.fetch(`/api/events/${createdId}`, { method: "DELETE" });
  check("owner delete -> 200", del.status === 200);
  const gone = await anon.fetch(`/api/events/${createdId}`);
  check("deleted event gone -> 404", gone.status === 404);
  const plist = await anon.fetch(`/api/events/${createdId}/participants`);
  check("participants cascade-deleted -> 404", plist.status === 404);

  const signout = await volunteer.fetch("/api/auth/sign-out", { method: "POST" });
  check("sign out", signout.status === 200);
  const afterOut = await volunteer.fetch("/api/users/me");
  check("session invalidated after sign out", afterOut.status === 401);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
