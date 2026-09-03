require("dotenv").config();
const jwt = require("jsonwebtoken");
const fs = require("fs");

// matches the 50 users bench/seed.js already creates in blogger_bench
const tokens = [];
for (let i = 1; i <= 50; i++) {
  tokens.push(
    jwt.sign({ email: `bench-user-${i}@example.com` }, process.env.JWT_SECRET, {
      noTimestamp: true,
    })
  );
}
fs.writeFileSync(__dirname + "/tokens.json", JSON.stringify(tokens));
console.log(`wrote ${tokens.length} tokens`);
