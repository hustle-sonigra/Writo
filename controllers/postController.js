// here i will the quereies that deal with the post 
// the logic that caters the CRUD operations on the post will all
// assembled here .

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../Models/user");
const postModel = require("../Models/post");
const postsCache = require("../cache/postsCache");
// verify mai we are checking if the two tokens are the same or not 
exports.getAllPosts = async (req, res) => {
    await req.user.populate("posts");
    // res.render("profile", { user: req.user });
    return res.status(200).json({user:req.user});
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
    const post = await postModel.findById(postId).populate("user","name").populate("likes","name");
    const likedByList = post.likes;
    const likedByUser = post.likes.some(
  u => u._id.toString() === user._id.toString()
);
    const likeCount = post.likes.length;
    res.render("blog",{
        user,
        post,
        likedByUser,
        likeCount,
        likedByList
    });
};


exports.createPosts = async (req,res) =>{
    // this page is viewed after you press submit on your new blog
    // this redirects to the new feed page , which also displays your newly added blog to it
    // let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    // let user = await userModel.findOne({email:data.email});
    let user = req.user;
    let post = await postModel.create({
        postData:`${req.body.postData}`,
        postTittle:`${req.body.postTittle}`,
        user:`${user._id}` 
    });
    user.posts.push(post._id);
    await user.save();
    postsCache.invalidate();
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
    
    // check if the user has this post authored ?
    let user = req.user;
    let postId = req.params.id;
    let post = await postModel.findById(req.params.id).populate("user","name").populate("likes","name");
    if(!post)
    {
        // if the post is empty
        return res.status(404).send("Post not found");
    }
    if(post.user._id.toString()!==user._id.toString())
    {
        // you are not authorized to be implementing such changes to the post.
        return res.status(403).send("Forbidden");
    }
    const likedByList = post.likes;
    const likedByUser = post.likes.some(
  u => u._id.toString() === user._id.toString()
);
// what needs to be done is to check the incoming token request se get the user 
// and then from the postId get the user , 
// then we compare the both to proceed with this furthur , that is the important detail here , in the underlying
// concept.
const likeCount = post.likes.length;
    let updatedPost = await postModel.findByIdAndUpdate(
      req.params.id,
      {
        postTittle: req.body.postTittle,
        postData: req.body.postData
      },
      { new: true }
    );
postsCache.invalidate();
res.render("blog",{user,post:updatedPost,likedByList,likedByUser,likeCount});
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
const post = await postModel.findById(postId).populate("user","name").populate("likes","name");
const likedByList = post.likes;
const likedByUser = post.likes.some(
  u => u._id.toString() === user._id.toString()
);
const likeCount = post.likes.length;
res.render("blogger",{user,post,likedByUser,likeCount,likedByList});
};

async function renderFeed(req,res){
    const data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    const user = await userModel.findOne({email:data.email});
    const allPosts = await postsCache.getAllPostsWithAuthor();
    // res.render("feed",{user:user,posts:allPosts});
    return res.status(200).json({
        success:true,
        data:{user,posts:allPosts}
    });
}

exports.toggleLike = async(req,res)=>{
    // here i have to save all the likes made to the DB
    const id = req.params.id;
    const userId = req.user._id;

    const alreadyLiked = await postModel.exists({ _id: id, likes: userId });

    await postModel.updateOne(
      { _id: id },
      alreadyLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } }
    );

    res.redirect(`/read/${id}`);
}

// escapes regex metacharacters so a keyword can't break out of the pattern
// (searchOutput used to build a RegExp straight from req.body with no escaping)
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// SEARCH_MODE picks which of the three query shapes searchOutput runs, so the
// bench harness can flip modes without a code edit. Defaults to "regex" to
// match production's current committed behaviour.
exports.searchOutput = async (req, res) => {
    const keyword = req.body.keyword;
    const mode = process.env.SEARCH_MODE || "regex";
    let posts;

    if (mode === "memory") {
        // no filter at the DB level — fetch everything, filter in JS.
        // kept slow on purpose: no projection, no .lean(), populate stays,
        // and the whole collection has to be scanned before filtering starts.
        const allPosts = await postModel.find().populate("user", "name");
        const lower = keyword.toLowerCase();
        posts = allPosts
            .filter(p =>
                p.postTittle?.toLowerCase().includes(lower) ||
                p.postData?.toLowerCase().includes(lower)
            )
            .slice(0, 20);
    } else if (mode === "text") {
        posts = await postModel
            .find(
                {
                    $text: {
                        $search: keyword
                    }
                },
                {
                    postTittle: 1,
                    postData: 1,
                    user: 1,
                    date: 1
                }
            ).limit(20).lean();
    } else {
        const regex = new RegExp(escapeRegex(keyword), "i");
        posts = await postModel
            .find(
                {
                    $or: [
                        { postTittle: regex },
                        { postData: regex }
                    ]
                },
                {
                    postTittle: 1,
                    postData: 1,
                    user: 1,
                    date: 1
                }
            ).limit(20).lean();
    }

    return res.status(200).json({
        success: true,
        data: { posts }
    });
};
// filter is powerful usecase 
// here we loop through the entire posts 
// match the word that we want in the given post or the tittle 
// if match happens in either of them we are creating a new array usme yeh sab daal diya jaega 
// this new array is temporary and also it is search specific that means hamara kaam pura ho jaata hai kust while using 
// .filter() utna hi powerful tool tha .some().

// important to pass the parameters that i want to provide in the required blog is thus essential when they are catered in the {} braces , it thus then is treated as an object
// write content ---> render Blog
// completeRead ----> render blogger 
// in done ejs pages ke UI pe i will have to attach what i want 
// this is what i have to do
// lets see how this turns out 


