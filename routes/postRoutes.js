const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleWare = require("../middleWare/authMiddleWare");

router.use(authMiddleWare);

router.get("/profile", postController.getAllPosts);
router.post("/post/create/display", postController.createPosts);
router.get("/blog/:id", postController.viewBlog);
router.get("/post/edit/:id",postController.accessToEdit);
router.post("/post/display/:id",postController.displayEdittedBlog);
router.get("/read/:id",postController.completeRead);
router.post("/create/post", postController.writeBlog);
router.get("/profile/:id",postController.writeContent);
router.post("/post/:id/like",postController.toggleLike);
router.post("/feed/filtered",postController.searchOutput);

module.exports = router;