# Session handoff

**Last updated:** (seed — replace by running `/handoff`)

## State of the app
- Signup, login, logout working; JWT stored in a plain cookie.
- Feed lists all posts with author names and a 100-char excerpt.
- Create, read, edit working. **Delete is not implemented** despite the README claiming it.
- Likes persist to `post.likes` and survive reload; hover shows who liked.
- Keyword search filters title + body in memory and renders `searchFeed`.

## In flight
- (nothing)

## Known issues
1. **`/blog/:id` throws.** `postController.viewBlog` renders `blog.ejs` with only
   `{user, post}`, but that view reads `likedByUser`, `likeCount` and `likedByList`.
   Either pass them the way `writeContent` does, or drop the route — nothing links to it.
2. **Cookie flags missing.** `res.cookie("token", token)` in `authController` sets no
   `httpOnly`, `secure` or `sameSite`. Token is readable from JS.
3. **No CSRF protection** on the like/edit/create POST forms.
4. **`searchFeed.ejs` has no stylesheet** and no link back to the feed — dead end page.
5. **`blog.ejs` and `blogger.ejs` are near-duplicates.** Same ~150 lines of CSS twice.
   Candidate for one shared partial plus an `isAuthor` flag.
6. **Search is O(n) in memory** — `find()` then `.filter()`. Fine now, not at scale.
7. **Delete route missing** from `postRoutes.js`.

## Decisions made
- Auth resolves users by **email** from the JWT payload, not by `_id`. The commented-out
  `findById(data.id)` variant in the middleware does not match the token shape — leave it dead.
- `like.js` toggles the icon optimistically, then the surrounding form POSTs and the server
  redirects. The UI flash is intentional, not a bug.

## Next up
1. Fix or remove the `/blog/:id` render contract bug.
2. Harden the auth cookie (`httpOnly`, `sameSite: "lax"`, `secure` in production).
3. Add the delete-post route with an ownership check, or correct the README.
4. Extract the shared blog view into a partial.
5. Style `searchFeed.ejs` to match the feed.

## Gotchas
- The field is `postTittle`, not `postTitle`. Two Ts.
- `app.js` still contains the entire pre-refactor app commented out. Ignore it; it is
  kept as study notes, not as live code.
