/**
 * Seeds clearly-labeled SAMPLE content so a fresh installation can be explored.
 * All records live in the real database and behave like real data (auth, joins,
 * ownership). Sample events carry `isSample: true` and are badged in the UI.
 *
 *   npm run seed            # idempotent — skips if sample data exists
 *   npm run seed -- --reset # wipe sample data first (requires ALLOW_SEED_RESET=true)
 */
import { ObjectId } from "mongodb";
import { auth } from "../lib/auth.js";
import { connectDb, ensureIndexes } from "../lib/db.js";
import { env } from "../config/env.js";
import type { EventDoc } from "../lib/serialize.js";

const DEMO_PASSWORD = "Kindora#Demo1";
const DAY = 24 * 60 * 60 * 1000;

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const demoUsers = [
  { name: "Ayesha Rahman", email: "ayesha@kindora.demo", role: "organizer", image: img("photo-1494790108377-be9c29b29330", 256) },
  { name: "Tanvir Ahmed", email: "tanvir@kindora.demo", role: "organizer", image: img("photo-1507003211169-0a1dd7228f2d", 256) },
  { name: "Nusrat Jahan", email: "nusrat@kindora.demo", role: "volunteer", image: img("photo-1438761681033-6461ffad8d80", 256) },
  { name: "Rafiq Islam", email: "rafiq@kindora.demo", role: "volunteer", image: img("photo-1500648767791-00dcc994a43e", 256) },
  { name: "Sadia Karim", email: "sadia@kindora.demo", role: "volunteer", image: img("photo-1544005313-94ddf0286df2", 256) },
  { name: "Imran Hossain", email: "imran@kindora.demo", role: "volunteer", image: img("photo-1472099645785-5658abf4ff4e", 256) },
] as const;

interface SeedEvent {
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  offsetDays: number;
  hour: number;
  organizer: 0 | 1;
}

const seedEvents: SeedEvent[] = [
  {
    title: "Rupsha Riverbank Cleanup Drive",
    description:
      "Join us for a morning of care along the Rupsha riverbank. We will collect plastic waste, sort recyclables, and map the worst litter hotspots for the city corporation. Gloves, bags, and refreshments are provided — bring water, sun protection, and a friend. Together we can give the riverfront back to the families who live beside it.",
    eventType: "Cleanup",
    thumbnail: img("photo-1560252829-804f1aedf1be"),
    location: "Rupsha Ghat, Khulna",
    offsetDays: 4,
    hour: 8,
    organizer: 0,
  },
  {
    title: "Mangrove Plantation Day at the Sundarbans Edge",
    description:
      "The Sundarbans protects our coast — and it needs our hands. We are planting 800 mangrove saplings along the embankment with guidance from local forest officers. Training, tools, seedlings, and lunch are arranged. No experience needed, just comfortable shoes and a willingness to get a little muddy for a greener tomorrow.",
    eventType: "Plantation",
    thumbnail: img("photo-1416879595882-3373a0480b5b"),
    location: "Mongla Port Road, Khulna",
    offsetDays: 9,
    hour: 9,
    organizer: 0,
  },
  {
    title: "Winter Clothing Donation Camp",
    description:
      "As winter approaches, hundreds of families in our city lack warm clothing. We are collecting, sorting, and packing sweaters, blankets, and shawls for distribution in Khalishpur and Batiaghata. Volunteers will help with intake, quality checks, and packing. Every item you sort is warmth delivered to someone who needs it.",
    eventType: "Donation",
    thumbnail: img("photo-1532629345422-7515f3d16bb6"),
    location: "Shib Bari More, Khulna",
    offsetDays: 12,
    hour: 10,
    organizer: 0,
  },
  {
    title: "Free Primary Health Check-up Camp",
    description:
      "Partnering with volunteer doctors and medical students, we are running a free check-up camp offering blood pressure and diabetes screening, basic consultations, and health awareness sessions for elders. Volunteers assist with registration, crowd guidance, and record keeping. Medical volunteers should mention their background when joining.",
    eventType: "Healthcare",
    thumbnail: img("photo-1576091160399-112ba8d25d1d"),
    location: "Sonadanga Community Center, Khulna",
    offsetDays: 6,
    hour: 9,
    organizer: 1,
  },
  {
    title: "Evening School for Street Children",
    description:
      "Every child deserves a classroom. Our evening school brings basic literacy, numeracy, and a warm meal to 60 street-connected children. We need volunteers to tutor small groups, read stories, and help serve dinner. Teaching experience is welcome but not required — patience and consistency matter most. Orientation provided on arrival.",
    eventType: "Education",
    thumbnail: img("photo-1497486751825-1233686d5d80"),
    location: "Boyra Main Road, Khulna",
    offsetDays: 2,
    hour: 16,
    organizer: 0,
  },
  {
    title: "Community Kitchen — 500 Warm Meals",
    description:
      "One kitchen, five hundred meals, countless smiles. We cook and distribute warm, nutritious food packages for day laborers and elderly residents living alone. Shifts cover prep, cooking, packing, and distribution by van. If you can chop vegetables or carry a crate, there is a place for you here. Aprons and hygiene kits provided.",
    eventType: "Community Service",
    thumbnail: img("photo-1593113598332-cd288d649433"),
    location: "Khalishpur, Khulna",
    offsetDays: 5,
    hour: 7,
    organizer: 1,
  },
  {
    title: "Nirala Park Restoration Morning",
    description:
      "Our neighborhood park has quietly faded — benches broken, flowerbeds overgrown. This restoration morning brings residents together to weed, repaint, and replant. Landscape architects are volunteering their plans; we bring the hands. Families welcome, with a dedicated kids' corner for little gardeners.",
    eventType: "Cleanup",
    thumbnail: img("photo-1542601906990-b4d3fb778b09"),
    location: "Nirala Residential Area, Khulna",
    offsetDays: 15,
    hour: 8,
    organizer: 0,
  },
  {
    title: "Blood Donation Awareness Marathon",
    description:
      "A single donation can save three lives. We are organizing a 5K awareness run followed by a voluntary blood donation session with the Sandhani blood bank. Volunteers help with route marshaling, registration desks, hydration points, and donor care. Runners and non-runners alike are welcome — every role keeps the cause moving.",
    eventType: "Healthcare",
    thumbnail: img("photo-1542810634-71277d95dcbb"),
    location: "Hatirjheel, Dhaka",
    offsetDays: 10,
    hour: 7,
    organizer: 1,
  },
  {
    title: "Rooftop Garden Workshop for Families",
    description:
      "Turn grey rooftops into green corners. This hands-on workshop teaches families to build container gardens with recycled materials — composting basics, seasonal vegetables, and seed saving included. Volunteers assist instructors, prepare soil kits, and guide children through planting their first seedling to take home.",
    eventType: "Plantation",
    thumbnail: img("photo-1466692476868-aef1dfb1e735"),
    location: "Dhanmondi, Dhaka",
    offsetDays: 18,
    hour: 10,
    organizer: 1,
  },
  {
    title: "Old Town Book Drive",
    description:
      "We collected 1,200 pre-loved books and delivered them to four rural school libraries around Khulna. Volunteers sorted, repaired, catalogued, and packed every title with care. Thank you to everyone who carried a box — those shelves are full because of you.",
    eventType: "Donation",
    thumbnail: img("photo-1524995997946-a1c2e315a42f"),
    location: "Khulna Old Town",
    offsetDays: -20,
    hour: 10,
    organizer: 0,
  },
  {
    title: "Coastal Embankment Tree Planting",
    description:
      "Six hundred saplings now stand along the Koyra embankment, planted by 40 volunteers in a single morning. The trees will hold soil, shade the path, and shelter birds for decades. This completed initiative is maintained by the local caretaker committee we trained together.",
    eventType: "Plantation",
    thumbnail: img("photo-1441974231531-c6227db76b6e"),
    location: "Koyra, Khulna",
    offsetDays: -35,
    hour: 8,
    organizer: 0,
  },
  {
    title: "Digital Literacy Bootcamp for Seniors",
    description:
      "Thirty grandparents learned to video-call their grandchildren, pay bills safely online, and spot scams. Volunteer mentors paired one-on-one with learners for three gentle sessions. We closed with tea, certificates, and a lot of proud smiles. Materials remain available at the public library.",
    eventType: "Education",
    thumbnail: img("photo-1522202176988-66273c2fd55f"),
    location: "Khulna Public Library",
    offsetDays: -12,
    hour: 15,
    organizer: 1,
  },
];

/** volunteer index (2..5) -> seed event indexes */
const seedJoins: Array<[number, number[]]> = [
  [2, [0, 1, 4, 9, 10]],
  [3, [0, 3, 5, 10, 11]],
  [4, [1, 2, 4, 6, 9, 11]],
  [5, [3, 5, 7, 10]],
];

async function main() {
  const db = await connectDb();
  await ensureIndexes(db);
  const events = db.collection<EventDoc>("events");
  const participants = db.collection("participants");
  const users = db.collection("user");

  const reset = process.argv.includes("--reset");
  if (reset) {
    if (!env.seedResetAllowed) {
      console.error("Refusing to reset: set ALLOW_SEED_RESET=true in server/.env first.");
      process.exit(1);
    }
    const demoEmails = demoUsers.map((u) => u.email);
    const demoUserDocs = await users.find({ email: { $in: demoEmails } }).toArray();
    const demoIds = demoUserDocs.map((u) => String(u._id));
    const sampleEvents = await events.find({ isSample: true }).toArray();
    const sampleIds = sampleEvents.map((e) => String(e._id));
    await participants.deleteMany({ $or: [{ eventId: { $in: sampleIds } }, { userId: { $in: demoIds } }] });
    await events.deleteMany({ isSample: true });
    await db.collection("session").deleteMany({ userId: { $in: demoIds } });
    await db.collection("account").deleteMany({ userId: { $in: demoIds } });
    await users.deleteMany({ email: { $in: demoEmails } } as never);
    console.log("Sample data removed.");
  }

  const existing = await events.countDocuments({ isSample: true });
  if (existing > 0) {
    console.log(`Sample data already present (${existing} events). Use --reset to reseed.`);
    process.exit(0);
  }

  console.log("Creating demo accounts…");
  const userIds: string[] = [];
  for (const demo of demoUsers) {
    const found = await users.findOne({ email: demo.email });
    if (found) {
      userIds.push(String(found._id));
      continue;
    }
    const result = await auth.api.signUpEmail({
      body: { name: demo.name, email: demo.email, password: DEMO_PASSWORD, role: demo.role, image: demo.image },
    });
    userIds.push(result.user.id);
    console.log(`  ${demo.role.padEnd(9)} ${demo.email}`);
  }

  console.log("Creating sample events…");
  const eventIds: ObjectId[] = [];
  const joinCounts = new Array(seedEvents.length).fill(0);
  for (const [volIdx, eventIdxs] of seedJoins) for (const e of eventIdxs) joinCounts[e]++;

  for (let i = 0; i < seedEvents.length; i++) {
    const seed = seedEvents[i];
    const organizerIdx = seed.organizer;
    const date = new Date(Date.now() + seed.offsetDays * DAY);
    date.setHours(seed.hour, 0, 0, 0);
    const createdAt = new Date(Date.now() - (seedEvents.length - i) * DAY);
    const doc = {
      title: seed.title,
      description: seed.description,
      eventType: seed.eventType,
      thumbnail: seed.thumbnail,
      location: seed.location,
      eventDate: date,
      creatorId: userIds[organizerIdx],
      creatorName: demoUsers[organizerIdx].name,
      participantCount: joinCounts[i],
      isSample: true,
      createdAt,
      updatedAt: createdAt,
    };
    const result = await events.insertOne(doc as never);
    eventIds.push(result.insertedId);
  }
  console.log(`  ${seedEvents.length} events (${seedEvents.filter((e) => e.offsetDays > 0).length} upcoming, ${seedEvents.filter((e) => e.offsetDays < 0).length} completed)`);

  console.log("Creating sample participations…");
  let joins = 0;
  for (const [volIdx, eventIdxs] of seedJoins) {
    for (const e of eventIdxs) {
      const eventDate = new Date(Date.now() + seedEvents[e].offsetDays * DAY);
      const joinedAt = new Date(Math.min(Date.now() - Math.random() * 3 * DAY, eventDate.getTime() - DAY));
      await participants.insertOne({ eventId: String(eventIds[e]), userId: userIds[volIdx], joinedAt } as never);
      joins++;
    }
  }
  console.log(`  ${joins} participations`);

  console.log("\nSeed complete. Demo accounts (password for all: " + DEMO_PASSWORD + "):");
  for (const demo of demoUsers) console.log(`  ${demo.role.padEnd(9)} ${demo.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
