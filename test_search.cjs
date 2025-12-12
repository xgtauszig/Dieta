
const fs = require('fs');
const Fuse = require('fuse.js');

try {
  const rawData = fs.readFileSync('src/data/taco_food_db.json', 'utf8');
  const tacoFoods = JSON.parse(rawData);

  console.log(`Loaded ${tacoFoods.length} items from TACO DB.`);

  const fuseTaco = new Fuse(tacoFoods, {
    keys: ['description'],
    threshold: 0.4,
    ignoreLocation: true
  });

  const query = "arroz";
  const results = fuseTaco.search(query);

  console.log(`Search for "${query}" returned ${results.length} results.`);
  if (results.length > 0) {
    console.log("First result:", results[0].item.description);
  }
} catch (e) {
  console.error(e);
}
