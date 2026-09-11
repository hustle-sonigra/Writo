require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Post = require("../Models/post");

// Atlas Search index for the "atlas" mode in searchOutput
// (controllers/postController.js) - name must stay "default", that's what
// the $search stage there is hardcoded to. Only works against a deployment
// that runs mongot (mongodb-atlas-local) - plain mongo:7 has no $search.
const DEFINITION = {
  mappings: {
    dynamic: false,
    fields: {
      postTittle: { type: "string" },
      postData: { type: "string" },
    },
  },
};

async function main() {
  await connectDB();

  const existing = await Post.collection.listSearchIndexes().toArray().catch(() => []);
  if (existing.some((i) => i.name === "default")) {
    console.log('Search index "default" already exists, skipping create.');
  } else {
    console.log('Creating Atlas Search index "default"...');
    await Post.collection.createSearchIndex({ name: "default", definition: DEFINITION });
  }

  // createSearchIndex returns before the index finishes building - querying
  // $search against a still-building index gives wrong counts and wrong
  // timings, so poll until status is READY before handing back control.
  process.stdout.write("Waiting for index to become READY");
  let ready = false;
  while (!ready) {
    const indexes = await Post.collection.listSearchIndexes().toArray();
    const idx = indexes.find((i) => i.name === "default");
    ready = !!idx && idx.queryable === true && idx.status === "READY";
    if (!ready) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log("\nSearch index is READY.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
