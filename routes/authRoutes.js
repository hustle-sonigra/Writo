const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


router.get("/", authController.renderHome);
router.get("/login", authController.renderLogin);
router.post("/api/v1/auth/login", authController.loginUser);
router.post("/create", authController.register);
router.get("/logout", authController.renderLogout);
router.get("/api/v1/auth/feed", authController.showFeed);
router.get("/index", authController.renderSignIn);


module.exports = router;
