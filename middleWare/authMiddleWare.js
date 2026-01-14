// idhar khali basic kaam krna hai apana ko
// the core idea of this new file is simple 
// we just have to ensure the routes se request yaha aae and then it passes to the controller
// the idea behind that is ke jab bhi controller ke paas access ho cheezo ko operate krna ka the main fuda there 
// is we have only authorised bande over there 
// thus yaha pe peform the job of verfication of the token 
// fetching the user from the DB and then exporting it back to the main control 
// jaha yeh process wapas nhii hona chahiye 
// it saves us from code duplication
// yaha pe i have just have to check ke bhai joh mere token hai is that vaid or not 
// utna hi kaam krna hai iss file mai 


// const requireAuth = async (req,res,next)=>{
//     req.__AUTH_MIDDLEWARE_RAN__ = true;
//     try{
//     const token = req.cookies.token;
//     if(!token)
//     {
//         // we have no token under this 
//        return  res.redirect("/login");
//     }

//     const data = jwt.verify(token,process.env.JWT_SECRET);
//     const user = await User.findById(data.id);

//     if(!user)
//     {
//         return res.redirect("/login");
//     }
//     req.user = user;
//     console.log(req.user);
//     next(); 
//   } catch (err) {
//     return res.redirect("/login");
//   }
// };


const jwt = require("jsonwebtoken");
const User = require("../Models/user");

const requireAuth = async (req, res, next) => {
//   console.log("🔹 AUTH MIDDLEWARE ENTERED");

  try {
    // console.log("Cookies:", req.cookies);

    const token = req.cookies?.token;
    // console.log("Token:", token);

    if (!token) {
    //   console.log("❌ NO TOKEN → redirect");
      return res.redirect("/login");
    }

    const data = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("JWT decoded:", data);
    // data = { email: "...", iat, exp }

    const user = await User.findOne({ email: data.email });
    // console.log("User from DB:", user);

    if (!user) {
    //   console.log("❌ USER NOT FOUND → redirect");
      return res.redirect("/login");
    }

    req.user = user;   // ✅ FULL mongoose document
    // console.log("✅ AUTH SUCCESS");
    req.__AUTH_MIDDLEWARE_RAN__ = true;
    next();
  } catch (err) {
    console.log("❌ AUTH ERROR:", err.message);
    return res.redirect("/login");
  }
};

module.exports = requireAuth;

// const requireAuth = async (req, res, next) => {
//   try {
//     console.log("MIDDLEWARE HIT");

//     console.log("Cookies:", req.cookies);

//     const token = req.cookies.token;
//     console.log("Token:", token);

//     if (!token) {
//       console.log("❌ NO TOKEN FOUND");
//       return res.redirect("/login");
//     }

//     const data = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded JWT:", data);

//     const user = await User.findById(data.id);
//     console.log("User from DB:", user);

//     if (!user) {
//       console.log("❌ USER NOT FOUND IN DB");
//       return res.redirect("/login");
//     }

//     req.user = user;
//     console.log("✅ AUTH SUCCESS");

//     next();
//   } catch (err) {
//     console.log("❌ AUTH ERROR:", err.message);
//     return res.redirect("/login");
//   }
// };

// what we are exporting from here is actuaclly the user that we have fetched from the DB
