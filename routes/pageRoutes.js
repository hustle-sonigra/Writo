    const express = require("express");
    const router = express.Router();

    router.get("/feed",(req,res)=>{
        res.render("feed");
    })

    router.get("/searchFeed",(req,res)=>{
        res.render("searchFeed");
    })

    router.get("/profile",(req,res)=>{
        res.render("profile");
    })

    router.get("/create/post",(req,res)=>{
        res.render("create");
    })

    // here on a particular requst made for a specific route i have to end up with the profile name , that yes 
    // we have the following ejs page rendered.

    module.exports = router;