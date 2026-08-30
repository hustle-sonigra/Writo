// Shared cache for the "all posts + author name" dataset used by both the
// feed (GET /api/v1/auth/feed) and search (POST /api/v1/post/filtered).
// This query is identical for every user, so it's cached once, globally,
// instead of per-request.
const postModel = require("../Models/post");

let cache = null;

async function getAllPostsWithAuthor() {
  if (!cache) {
    cache = await postModel.find().populate("user", "name");
  }
  return cache;
}

// Call after any create/edit so the next read repopulates fresh data.
// Deliberately NOT called on like/unlike: feed and search don't render
// likes, so a like toggle doesn't make this cache stale for anything it
// actually serves.
function invalidate() {
  cache = null;
}

module.exports = { getAllPostsWithAuthor, invalidate };
