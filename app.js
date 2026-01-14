require("dotenv").config();
const express = require("express");
const app = express();
// const mongoose = require("mongoose");
// const userModel = require("./Models/user");
// const postModel = require("./Models/post");
// const bcrypt = require("bcrypt");
// const jwt = require('jsonwebtoken');
const path = require("path");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3000;
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");

// connect DB
connectDB();

// view engine
app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

app.use("/", authRoutes);
app.use("/", postRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// routing and the entire logic

// first route at the /
// app.get("/",(req,res)=>{
//     res.render("home");
// });

// first valid page 
// app.get("/index",(req,res)=>{
//     res.render("index");
// });

// creation of token on signin and logins

// app.post("/create", async (req, res) => {
//   try {
//     // Hash password securely
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(req.body.password, salt);
//     // Create new user
//     const user = await userModel.create({
//       name: req.body.name,
//       age: req.body.age,
//       email: req.body.email,
//       password: hash,
//     });
//     // Generate JWT
//     const token = jwt.sign({ email: user.email },process.env.JWT_SECRET);
//     // Set cookie
//     res.cookie("token", token);

//     // Redirect or render feed page
//     res.redirect("/feed");
//     // OR if you have your own function:
//     // return renderFeed(req, res);
//   } catch (err) {
//     console.error("Error creating user:", err);
//     res.status(500).render("wrong"); // or res.send("Something went wrong");
//   }
// });

//logging out
// app.get("/logout",(req,res)=>{
// res.cookie("token","");
// res.redirect("/");
// });

//loging in
// app.get("/login",(req,res)=>
// {
//     res.render("login");
// });

//correct login directs you to the feed
// app.post("/login", async (req, res) => {
//     let user = await userModel.findOne({ email: req.body.email });
//     let allPosts = await postModel.find().populate("user");
//     if (!user) return res.render("wrong");
//     bcrypt.compare(req.body.password, user.password, function(err, result) {
//         if (result) {
//             // Only issue token after successful login
//             let token = jwt.sign({ email: user.email }, process.env.JWT_SECRET,{ noTimestamp: true });
//             res.cookie("token", token);
//             res.render("feed",{user:user,posts:allPosts}); 
//         } else {
//             return res.render("wrong");
//         }
//     });
// });


// app.post("/feed",(req,res)=>{
//      return renderFeed(req,res);
// });

// app.get("/feed",(req,res)=>{
//     return renderFeed(req,res);
// })

// app.get("/profile",async (req,res)=>{
//     let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
//     let user = await userModel.findOne({email:data.email}).populate("posts");
//     res.render("profile",{user:user});
// });

// app.get("/profile/:id",async(req,res)=>{
//     // here i have to render the view page of the blog
//     let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
//     let user = await userModel.findOne({email:data.email});
//     let postId = req.params.id;
//     let post = await postModel.findById(postId);
//     res.render("blog",{user,post});
// })

// iss method ke andar i have to create a post.
// post ki details daalni hai 
// the major part here is linking the post id and the user id 
// yeh waala part toh sochna padega i do have any clue about it 
// lets see how it goes!
// now i have access to the user that is currently logged in 
// i have uske credentials

// app.post("/create/post",(req,res)=>{
// // this is the route where i want to allow dynamic writing of the content
// // by the user, i will create a form at the route and make and accept text content from it
// res.render("create");
// });

// app.post("/post/create/display",async (req,res)=>{
//     let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
//     let user = await userModel.findOne({email:data.email});
//     let post = await postModel.create({
//         postData:`${req.body.postData}`,
//         postTittle:`${req.body.postTittle}`,
//         user:`${user._id}` 
//     });
//     user.posts.push(post._id);
//     await user.save();
//     //res.render("feed",{user:user,post:post})
//     return renderFeed(req,res);
// });

// app.get("/blog/:id",async (req,res)=>{
//     let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
//     let user = await userModel.findOne({email:data.email});
//     let postId = req.params.id;
//     let post = await postModel.findById(postId);
//     res.render("blog",{user,post});
// })

// res.send(post) , this one here is the output that i have for the 
// creation of the post.
// abb iss post mai user waale section mai i have to put up the user id 
// i will retrieve this user id . where will i retrieve this from?

// app.post("/post/display/:id",async (req,res)=>{
//     // this is the route where we will display the edited maal , 
//     // so that for each edit we dont end up making a new id.
//     let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
//     let user = await userModel.findOne({email:data.email});
//     let post = await postModel.findById(req.params.id);

//     let updatedPost = await postModel.findByIdAndUpdate(
//       req.params.id,
//       {
//         postTittle: req.body.postTittle,
//         postData: req.body.postData
//       },
//       { new: true }
//     );
// res.render("blog",{user:user,post:updatedPost});
// });


// this route allows the admin the access of the content and to edit it.
// the access to this is only to the banda who has made this. i mean only the guys who
// have built this can edit this.
// first:verify the author
// Second:route to the main page where the priorly written content is there
// and we have an option of updation of the content.
// Third:link an update button that again redirects to the display page so that
// i can read the content again.
// app.get("/post/edit/:id",async (req,res)=>{
// let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
// let user = await userModel.findOne({email:data.email});
// let postId = req.params.id;
// let post = await postModel.findById(postId);

// // let post = await postModel.findById(user.posts[0]);
// if(user.posts.some(p => p.equals(postId)))
// {
//     let post = await postModel.findById(postId);
//     res.render("update",{post});
// }
// else
// {
//     res.send("No you cannot edit");
// }
// });

// i also want to add the aspects of viewing : that means when i login from a 
// different id i get to view the content of the people who have uploaded 
// their blogs. The spectator has the feature of liking the content and on 
// the other hand we have an author who has the righ to like the others 
// content and additinally he can also edit the content published by himself.

async function renderFeed(req,res){
    const data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    const user = await userModel.findOne({email:data.email});
    const allPosts = await postModel.find().populate("user");
    res.render("feed",{user:user,posts:allPosts});
}
// here the line const allPosts = await postModel.find().populate("user");
// for all the posts created there is a user section for each one available 
// we thus extract the post data for each and under the id we extract the 
// info stored under it using the populate keyword and thus now id is not 
// only numbers , but also hold the crucial data under it .
// app.get("/read/:id",async (req,res)=>{
// const postId = req.params.id;
// const completeData = await postModel.findById(postId).populate("user");
// res.render("blogger",{post:completeData});
// });




