const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


router.get("/", authController.renderHome);
router.get("/login", authController.renderLogin);
router.post("/login", authController.renderLoginPage);
router.post("/create", authController.register);
router.get("/logout", authController.renderLogout);
router.get("/feed", authController.Feed);
router.get("/index", authController.renderSignIn);


module.exports = router;
