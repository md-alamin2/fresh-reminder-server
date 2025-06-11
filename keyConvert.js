const fs = require('fs');
const key = fs.readFileSync("./firebase-service-admin-key.json", "utf8");
const base = Buffer.from(key).toString("base64");
console.log(base);