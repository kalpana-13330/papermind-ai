const fs = require('fs');
const s = fs.readFileSync('frontend/index.html', 'utf8');
const regex = /<section[^>]*id="([^"]*)"[^>]*>/g;
let m;
while ((m = regex.exec(s)) !== null) {
  console.log('Section id:', m[1], 'Full match:', m[0]);
}
