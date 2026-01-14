// here i have to connect the databse :
// mongo DB ke connection waali lines idhar likhni hai
// this is independent work allotment for our app here 
// this folder has a function in it and we export the result the of this 
// itself, here we have the final answer as the DB ka line.
const mongoose = require("mongoose");
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/blogger';
const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

