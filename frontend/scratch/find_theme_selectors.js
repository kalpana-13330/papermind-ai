const fs = require('fs');
const s = fs.readFileSync('frontend/assets/css/style.css', 'utf8');
const regex = /\[data-theme=[^\]]*\]/g;
let m;
const matches = new Set();
while ((m = regex.exec(s)) !== null) {
  matches.add(m[0]);
}
console.log('Matches:', Array.from(matches));
