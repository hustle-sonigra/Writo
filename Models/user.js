require("dotenv").config();
const mongoose = require("mongoose");
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/blogger';


const userSchema = mongoose.Schema({
    name:String,
    age:Number,
    email:String,
    password:String,
    posts:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'post'
            }
          ]
});
module.exports=mongoose.model("user",userSchema);