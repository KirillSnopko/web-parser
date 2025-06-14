const fs = require('fs');
const path = require('path');

// Paths to input and output files
const FILE_1 = path.join(__dirname, 'result', 'email_unique_apps_13.06.2025.json');
const FILE_2 = path.join(__dirname, 'result', 'email_unique_apps_14.06.2025.json');

const OUTPUT_LOW = path.join(__dirname, 'rating_3.json');
const OUTPUT_MEDIUM = path.join(__dirname, 'rating_3_4.json');
const OUTPUT_HIGH = path.join(__dirname, 'rating_4_5.json');

// Read JSON files
function readJSONFile(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Load both files
let data1 = [];
let data2 = [];

try {
  data1 = readJSONFile(FILE_1);
} catch (err) {
  console.error(`Error reading ${FILE_1}:`, err);
}

try {
  data2 = readJSONFile(FILE_2);
} catch (err) {
  console.error(`Error reading ${FILE_2}:`, err);
}

// Merge arrays
const allData = [...data1, ...data2];

// Initialize buckets
const lowRating = [];
const mediumRating = [];
const highRating = [];

// Categorize apps by rating
allData.forEach(app => {
  const rating = parseFloat(app.AverageRating);

  if (rating < 3) {
    lowRating.push(app);
  } else if (rating >= 3 && rating < 4) {
    mediumRating.push(app);
  } else if (rating >= 4) {
    highRating.push(app);
  }
});

// Write results to files
fs.writeFileSync(OUTPUT_LOW, JSON.stringify(lowRating, null, 2), 'utf8');
fs.writeFileSync(OUTPUT_MEDIUM, JSON.stringify(mediumRating, null, 2), 'utf8');
fs.writeFileSync(OUTPUT_HIGH, JSON.stringify(highRating, null, 2), 'utf8');

console.log(`✅ Files created:`);
console.log(`- 1-star.json (${lowRating.length} apps)`);
console.log(`- 3-4-stars.json (${mediumRating.length} apps)`);
console.log(`- 4-5-stars.json (${highRating.length} apps)`);