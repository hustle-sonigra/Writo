// here i will the quereies that deal with the post 
// the logic that caters the CRUD operations on the post will all
// assembled here .

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../Models/user");
const postModel = require("../Models/post");


// verify mai we are checking if the two tokens are the same or not 
exports.getAllPosts = async (req, res) => {
    await req.user.populate("posts");
    res.render("profile", { user: req.user });
};
// idhar user ke andar we have all the posts made by this particular user 
// that is the key here 

// here i have to render the view page of the blog
    // the full view page of the individual blog
    // this path works when i view my own blog in the full page 
    // matlab the authorised user ka blog at that point in time.
    // let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    // let user = await userModel.findOne({email:data.email});

exports.writeContent = async (req, res) => {
    const user = req.user;
    const postId = req.params.id;
    const post = await postModel.findById(postId);
    const likedByUser = post.likes.some(
        id => id.toString() === user._id.toString()
    );
    res.render("blog",{
        user,
        post,
        likedByUser
    });
};


exports.createPosts = async (req,res) =>{
    // this page is viewed after you press submit on your new blog
    // this redirects to the new feed page , which also displays your newly added blog to it
    // let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    // let user = await userModel.findOne({email:data.email});
    console.log(req.__AUTH_MIDDLEWARE_RAN__);
    let user = req.user;
    let post = await postModel.create({
        postData:`${req.body.postData}`,
        postTittle:`${req.body.postTittle}`,
        user:`${user._id}` 
    });
    user.posts.push(post._id);
    await user.save();
    //res.render("feed",{user:user,post:post})
    return renderFeed(req,res);
};

exports.viewBlog = async (req,res) => {
    let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    let user = await userModel.findOne({email:data.email});
    let postId = req.params.id;
    let post = await postModel.findById(postId);
    res.render("blog",{user,post});
};

exports.writeBlog = (req,res) =>{
res.render("create");
};

exports.displayEdittedBlog = async (req,res) => {
    // this is the route where we will display the edited maal , 
    // so that for each edit we dont end up making a new id.
    let user = req.user;
    let post = await postModel.findById(req.params.id);

    let updatedPost = await postModel.findByIdAndUpdate(
      req.params.id,
      {
        postTittle: req.body.postTittle,
        postData: req.body.postData
      },
      { new: true }
    );
res.render("blog",{user:user,post:updatedPost});
};

exports.accessToEdit = async (req,res) => {
// when you are authorised to edit the particular blog
let user = req.user;
let postId = req.params.id;
let post = await postModel.findById(postId);

// let post = await postModel.findById(user.posts[0]);
if(user.posts.some(p => p.equals(postId)))
{
    let post = await postModel.findById(postId);
    res.render("update",{post});
}
else
{
    res.send("No you cannot edit");
}
};
// this one is for the full page read of an author that is not u
// kisi aur author ka jab app read kroo toh yeh hoga na....
// abb idhar i have to make sure that i send back what i have to 

exports.completeRead = async (req,res) => {
const user = req.user;
const postId = req.params.id;
const post = await postModel.findById(postId).populate("user");
const likedByUser = post.likes.some(id => id.toString() === user._id.toString());
res.render("blogger",{user,post,likedByUser});
};

async function renderFeed(req,res){
    const data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    const user = await userModel.findOne({email:data.email});
    const allPosts = await postModel.find().populate("user");
    res.render("feed",{user:user,posts:allPosts});
}

// write content ---> render Blog
// completeRead ----> render blogger 
// in done ejs pages ke UI pe i will have to attach what i want 
// this is what i have to do
// lets see how this turns out 


