require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

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