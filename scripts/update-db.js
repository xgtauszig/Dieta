import fs from 'node:fs';
import https from 'node:https';

const URL = 'https://raw.githubusercontent.com/resen-dev/web-scraping-tbca/main/alimentos.txt';
const OUTPUT_FILE = './src/data/tbca_database.json';

const fetchFile = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
};

const parseValue = (val) => {
    if (!val || val === 'NA' || val === 'tr') return 0;
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    return Number(val) || 0;
};

const cleanName = (name) => {
    if (!name) return '';
    // Remove trailing commas and spaces
    let cleaned = name.trim().replace(/,+$/, '');

    // Remove scientific names: ", Genus species..."
    // Strategy: Look for ", Word word..." at the end where Word is capitalized and word is lowercase.
    // This is a heuristic.
    // Example: "Abacate, cru, Persea americana Mill." -> "Abacate, cru"
    // "Queijo, Minas, fresco" -> "Queijo, Minas, fresco" (fresco is lowercase)
    // "Tostines" -> "Tostines"

    // Regex explanation:
    // ,             match comma space
    // [A-Z][a-z]+   match Genus (Capitalized)
    // [a-z]+        match species (lowercase)
    // .*$           match anything else until end (e.g. Author)
    // We only remove if this pattern is found at the end.
    cleaned = cleaned.replace(/, [A-Z][a-z]+ [a-z]+.*$/, '');

    // Also specific cleanup for trailing junk if scientific name didn't match perfectly but left trailing chars?
    // Not needed if regex is precise.

    return cleaned;
};

const run = async () => {
    console.log('Fetching data...');
    const rawData = await fetchFile(URL);
    // Split by newline. The file is NDJSON (one JSON object per line).
    const lines = rawData.split('\n');

    const foods = [];

    console.log(`Processing ${lines.length} lines...`);

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const item = JSON.parse(line);

            // Map Nutrients
            // Data structure: item.nutrientes = [{ "Componente": "...", "Unidades": "...", "Valor por 100g": "..." }]
            const getNutrient = (comp, unit) => {
                const n = item.nutrientes.find(x => x.Componente === comp && (unit ? x.Unidades === unit : true));
                return n ? parseValue(n['Valor por 100g']) : 0;
            };

            const calories = getNutrient('Energia', 'kcal');
            const protein = getNutrient('Proteína', 'g');
            // Try 'Carboidrato total'
            const carbs = getNutrient('Carboidrato total', 'g');
            const lipids = getNutrient('Lipídios', 'g');

            // Construct new item
            const food = {
                id: item.codigo, // Keep original string ID for now
                nome: cleanName(item.descricao),
                grupo: item.classe,
                calorias: calories,
                proteinas: protein,
                carboidratos: carbs,
                gorduras: lipids,
                // Standardize
                baseQuantity: 100,
                unit: 'g'
                // origin: 'tbca' will be added in foodService or here?
                // Plan said: "Salve o resultado ... mantendo apenas: id, nome, grupo, calorias, proteinas, carboidratos, gorduras."
                // I will add the keys the Prompt asked for.
            };

            // Validate essential fields?
            // If all macros are 0, it might be Water or Salt. We keep it.

            foods.push(food);

        } catch (e) {
            // Ignore parse errors for empty lines or weird chunks
            // console.error('Error parsing line:', e.message);
        }
    }

    console.log(`Processed ${foods.length} items successfully.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(foods, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
};

run().catch(console.error);
