const fs = require('fs');
const s = fs.readFileSync('frontend/assets/css/style.css', 'utf8');
const regex = /html\[data-theme=["']light["']\][^{]*\{/g;
let m;
while ((m = regex.exec(s)) !== null) {
  console.log(m[0]);
}
