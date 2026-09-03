require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Post = require("../Models/post");

async function main() {
  await connectDB();
  console.log("Building declared indexes for Post model...");
  await Post.init();
  const indexes = await Post.collection.getIndexes();
  console.log("Indexes now:", JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
