# Writo — Project Context

Full-stack blogging platform. Backend-driven, MVC, server-rendered EJS.
Live: https://writo-l1yl.onrender.com

## Stack
Node.js + Express 5 · EJS · MongoDB (Mongoose 8) · JWT in a cookie · bcrypt · Render

## Layout
- `app.js` — entry. dotenv, cookieParser, urlencoded, static `public/`, mounts both routers at `/`
- `config/db.js` — mongoose connect, exits process on failure
- `Models/user.js` — name, age, email, password(hash), posts[ObjectId → post]
- `Models/post.js` — postData, postTittle, user(ObjectId), likes[ObjectId → user], date
- `routes/authRoutes.js` — public: `/`, `/login`, `/create`, `/logout`, `/feed`, `/index`
- `routes/postRoutes.js` — **every** route behind `requireAuth` via `router.use()`
- `middleWare/authMiddleWare.js` — reads `req.cookies.token`, `jwt.verify`, looks user up by
  **email** (not id), attaches the full mongoose doc as `req.user`, else redirects to `/login`
- `controllers/authController.js` · `controllers/postController.js`
- `views/*.ejs` · `public/stylesheets` · `public/javascripts/like.js`

## Conventions — follow these, do not "fix" them silently
- The field is spelled **`postTittle`** everywhere (schema, forms, views). Renaming it is a
  breaking migration; only do it if explicitly asked.
- JWT payload is `{ email }`. Middleware resolves by email. Keep that contract.
- `req.user` is a full mongoose document, so `.save()` and `.populate()` work directly on it.
- Controllers render views; routes contain no logic.
- Views that show likes need **all** of `post`, `likedByUser`, `likeCount`, `likedByList`.
  `likedByList` comes from `.populate("likes","name")`.
- Comments in this codebase are informal Hinglish study notes. Leave existing ones alone.

## Views and who renders them
- `home` `index` `login` `wrong` — auth flow
- `feed` — all posts + search bar (`authController.Feed`, `renderLoginPage`, `createPosts`)
- `profile` — the logged-in user's own posts
- `blog` — own post, full read (`writeContent`, `displayEdittedBlog`, `viewBlog`)
- `blogger` — someone else's post, full read (`completeRead`)
- `update` — edit form · `searchFeed` — keyword results

## Commands
```bash
npm install
npm start          # node app  → PORT or 3000
```
`.env` needs `MONGO_URI` and `JWT_SECRET`.

## Working agreement
- Small, reviewable diffs. Explain the flow before changing it.
- Never commit `.env`, never log tokens or password hashes.
- When you finish a chunk of work, run `/handoff`.
