// iss file mai we have the credentials of the posts that we will make
// mulitple models can be cretaed . This one is for the posts of the users
const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
   postData:String,
   postTittle:String,
   user:
   {
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   likes:
   [
      {
         type:mongoose.Schema.Types.ObjectId,
         ref:"user"
      }
   ],
   date:
   {
    type:Date,
    default:Date.now
   }
});

module.exports=mongoose.model("post",postSchema);  
// like naam ka ek array bana dia hai idhar humne 
// this array is unique and special 
// i enjoy having this 
// the fundamental is ke we have many likes for a particular post , we have to track the users liking the post and on top of that we also have to ensure that we sort of make this 
// one user gets one like. 
// we stop the user from liking more than once on a post.
// also the users who have liked the post should be popped up as a list , this can be accessed to get a hold of all the current users that have liked a particular post 
// multiple devices se bhi ek baar krke dekhi jayegi yeh cheez.

//har post ke lie we have to maintian a list of who all have liked the post 
// thus it is that key job bata rhaa hai ki under posts hi hummm isko daal de 
// also the array part is 
// the first tells ke type of the data that we sort of store under the in this segment 
// this is objectID , each object represent the unique user 
// har ke user ke specific object id hoga 
// that is what excites me.

// as the like button is clicked , do i add an eventlistener on it to execute my thing 
// iss project maine abhi tak ek bhi baar event listener ko use nhhii kia hai 
// is it a kidish practise ?
// industry standards ke hisaab se where does it stand ? 
// are we well versed with the topic ?

// i think overall to boost and sort of appreciate the performance levels we can assume an eventListener to work better in such a case that we hold 
// badhiya , change and uniqueness with the example is taught to us 
// where to be using event listener and where to be using a form 
// when we want to reload and pass to a new page a new loaction the best option is to use a form there , page reload ho rhaa hai na whaahhaa pe , thus it makes some good sense to be done that way 
// rather this next option that we have as of now is that we cater the use of event listener here 
// the particular event listener is going to be useful as we sort of establish the working of it by understanding the working 
