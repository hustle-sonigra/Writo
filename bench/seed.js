require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../Models/user");
const Post = require("../Models/post");

const SEED_USERS = parseInt(process.env.SEED_USERS || "50", 10);
const SEED_POSTS = parseInt(process.env.SEED_POSTS || "100000", 10);
const SEED = parseInt(process.env.SEED || "42", 10);

const COMMON_KEYWORD = "javascript";
const RARE_KEYWORD = "xenolith";
const MISS_KEYWORD = "gerrymandering";
const RARE_COUNT = 25;
const COMMON_FRACTION = 0.2;

// Plain nouns only — none is a substring of another, or of any of the three
// keywords above, or vice versa. Keeps the frequency bands from leaking into
// each other under searchOutput's substring-matching regex.
const FILLER_WORDS = [
  "apple", "breeze", "canyon", "drift", "ember", "forest", "glacier", "harbor",
  "island", "jungle", "kettle", "lantern", "meadow", "nebula", "orchard",
  "pebble", "quartz", "river", "summit", "thicket", "umbrella", "valley",
  "willow", "yonder", "zephyr", "anchor", "boulder", "cactus", "desert",
  "echo", "falcon", "garden"
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// mulberry32 — deterministic PRNG seeded from SEED, so re-running the seed
// script with the same SEED/SEED_USERS/SEED_POSTS reproduces the exact same
// dataset next month. Not reseeded between runs within a single seed() call —
// each mode benchmark reuses one seeded database, it doesn't reseed per mode.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);

function randomInt(maxExclusive) {
  return Math.floor(rng() * maxExclusive);
}

function shuffled(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomWords(count) {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(FILLER_WORDS[randomInt(FILLER_WORDS.length)]);
  }
  return words;
}

function makeBody(injectWord) {
  const words = randomWords(30 + randomInt(40));
  if (injectWord) {
    words.splice(randomInt(words.length + 1), 0, injectWord);
  }
  return words.join(" ");
}

function makeTitle(index) {
  return `Bench Post ${index} ${randomWords(4).join(" ")}`;
}

async function main() {
  await connectDB();

  const resolvedUri = process.env.MONGO_URI || "mongodb://localhost:27017/blogger";
  const safeUri = resolvedUri.replace(/\/\/[^@/]*@/, "//");
  console.log(`Seeding against: ${safeUri}`);
  console.log(`SEED: ${SEED} (reruns with the same SEED/SEED_USERS/SEED_POSTS reproduce this dataset)`);

  console.log("Clearing existing bench data...");
  await Post.deleteMany({});
  await User.deleteMany({});

  console.log(`Creating ${SEED_USERS} users...`);
  const sharedHash = await bcrypt.hash("bench-password", 10);
  const userDocs = [];
  for (let i = 1; i <= SEED_USERS; i++) {
    userDocs.push({
      name: `Bench User ${i}`,
      age: 20 + (i % 40),
      email: `bench-user-${i}@example.com`,
      password: sharedHash,
      posts: []
    });
  }
  const users = await User.insertMany(userDocs);

  console.log(`Creating ${SEED_POSTS} posts...`);
  const commonTarget = Math.round(SEED_POSTS * COMMON_FRACTION);
  const shuffledIndices = shuffled(Array.from({ length: SEED_POSTS }, (_, i) => i));
  const commonSet = new Set(shuffledIndices.slice(0, commonTarget));
  const rareSet = new Set(shuffledIndices.slice(commonTarget, commonTarget + RARE_COUNT));

  const postDocs = [];
  for (let i = 0; i < SEED_POSTS; i++) {
    const user = users[randomInt(users.length)];
    let inject = null;
    if (commonSet.has(i)) inject = COMMON_KEYWORD;
    else if (rareSet.has(i)) inject = RARE_KEYWORD;

    postDocs.push({
      postTittle: makeTitle(i),
      postData: makeBody(inject),
      user: user._id,
      date: new Date()
    });
  }

  const insertedPosts = await Post.insertMany(postDocs);

  console.log("Back-filling user.posts...");
  const postIdsByUser = new Map();
  for (const post of insertedPosts) {
    const key = post.user.toString();
    if (!postIdsByUser.has(key)) postIdsByUser.set(key, []);
    postIdsByUser.get(key).push(post._id);
  }
  const bulkOps = Array.from(postIdsByUser.entries()).map(([userId, postIds]) => ({
    updateOne: {
      filter: { _id: userId },
      update: { $push: { posts: { $each: postIds } } }
    }
  }));
  if (bulkOps.length) {
    await User.bulkWrite(bulkOps);
  }

  console.log("Verifying injected keyword counts...");
  const countFor = (keyword) => {
    const regex = new RegExp(escapeRegex(keyword), "i");
    return Post.countDocuments({ $or: [{ postTittle: regex }, { postData: regex }] });
  };
  const [commonActual, rareActual, missActual] = await Promise.all([
    countFor(COMMON_KEYWORD),
    countFor(RARE_KEYWORD),
    countFor(MISS_KEYWORD)
  ]);

  console.log(
    `Injected counts -> common(${COMMON_KEYWORD}): ${commonActual}, ` +
    `rare(${RARE_KEYWORD}): ${rareActual}, miss(${MISS_KEYWORD}): ${missActual}`
  );
  console.log(`Done. users: ${users.length}, posts: ${insertedPosts.length}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
