const fs = require('fs');
const s = fs.readFileSync('frontend/assets/css/style.css', 'utf8');
const lines = s.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('data-theme')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
