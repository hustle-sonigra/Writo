// here i will paste the entire logic.(pura business logic)
// the entire business logic is under this folder 
// for this project of ours we have to main functionallitites under this.
// one is if it a post and the other is if it an authentication ki bakchodi
// example - AUTH 
// This will comprise of login , logout , signin ,token 
// is generated with us loggin in thus woh waala kam yahi pe hoga , 
// fair enough with that!

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../Models/user");
const postModel = require("../Models/post");

exports.renderHome = (req,res) =>{
    res.render("home");
};

exports.renderSignIn = (req,res) =>{
    console.log("hello world");
    res.render("index");
};

// token generation 
exports.register = async (req,res)=> {
  try {
    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    // Create new user
    const user = await userModel.create({
      name: req.body.name,
      age: req.body.age,
      email: req.body.email,
      password: hash,
    });
    // Generate JWT
    const token = jwt.sign({ email: user.email },process.env.JWT_SECRET);
    // Set cookie
    res.cookie("token", token);

    // Redirect or render feed page
    res.redirect("/feed");
    // OR if you have your own function:
    // return renderFeed(req, res);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).render("wrong"); // or res.send("Something went wrong");
  }
};

exports.renderLogout = async (req,res) =>{
res.cookie("token","");
res.redirect("/");
};

exports.renderLogin = async (req,res) => 
{
    res.render("login");
};

exports.renderLoginPage  = async (req,res) => {
    let user = await userModel.findOne({ email: req.body.email });
    let allPosts = await postModel.find().populate("user");
    // ok so this line here has the working saying ke bhai we are using .find()
    // and if we do not add any parameter to this then we end up with allposts
    // then later using .populate(user) this changes the object ID in the arrays and adds in the usr details 
    // thus through this we can now access the  post.user.userName
    if (!user) return res.render("wrong");
    bcrypt.compare(req.body.password, user.password, function(err, result) {
        if (result) {
            // Only issue token after successful login
            let token = jwt.sign({ email: user.email }, process.env.JWT_SECRET,{ noTimestamp: true });
            res.cookie("token", token);
            res.render("feed",{user:user,posts:allPosts}); 
        } else {
            return res.render("wrong");
        }
    });
};

exports.Feed   = async (req,res) =>{
     return renderFeed(req,res);

};

async function renderFeed(req,res){
    const data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    const user = await userModel.findOne({email:data.email});
    const allPosts = await postModel.find().populate("user");
    res.render("feed",{user:user,posts:allPosts});
}






