// scripts/update-db.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://raw.githubusercontent.com/resen-dev/web-scraping-tbca/main/alimentos.txt';
const OUTPUT_PATH = path.join(__dirname, '../src/data/tbca_database.json');

const fetchAndProcess = async () => {
  console.log(`Downloading data from ${URL}...`);
  try {
    const response = await fetch(URL);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

    // The file format in this specific repo seems to be NDJSON (Newline Delimited JSON)
    // or a stream of JSON objects concatenated.
    // The curl output shows multiple JSON objects, one per line (likely).
    // Let's parse it line by line.

    const textData = await response.text();
    const items = [];
    const lines = textData.split('\n');

    console.log(`Found ${lines.length} lines. Processing...`);

    lines.forEach(line => {
        if (!line.trim()) return;
        try {
            const item = JSON.parse(line);
            items.push(item);
        } catch (e) {
            // Ignore parse errors for empty lines or malformed parts
        }
    });

    console.log(`Parsed ${items.length} items. Mapping...`);

    const processedData = items.map(item => {
        // Extraction Helper
        const getNutrient = (name) => {
            const n = item.nutrientes.find(x => x.Componente === name || x.Componente.startsWith(name));
            if (!n) return 0;
            // Value is "Valor por 100g", e.g., "101" or "0,18" or "NA" or "tr"
            let valStr = n['Valor por 100g'];
            if (!valStr || valStr === 'NA' || valStr === 'tr') return 0;
            valStr = valStr.replace(',', '.').replace(/[^\d.-]/g, '');
            return parseFloat(valStr) || 0;
        };

        // Find specific components
        const energyKcal = getNutrient('Energia', 'kcal') ||
                           item.nutrientes.find(x => x.Componente === 'Energia' && x.Unidades === 'kcal')?.['Valor por 100g'];

        // Specifically look for unit 'kcal' for energy
        const kcalObj = item.nutrientes.find(x => x.Componente === 'Energia' && x.Unidades === 'kcal');
        const kcalVal = kcalObj ? parseFloat(kcalObj['Valor por 100g'].replace(',', '.') || '0') : 0;

        return {
          id: `TBCA-${item.codigo}`,
          nome: item.descricao,
          grupo: item.classe,
          calorias: kcalVal,
          proteinas: getNutrient('Proteína'),
          carboidratos: getNutrient('Carboidrato total') || getNutrient('Carboidrato disponível'), // Prefer available? Or total?
                                                                                                 // TACO uses total usually, but let's check.
                                                                                                 // Let's use 'Carboidrato total' for compatibility unless 'Carboidrato disponível' is preferred.
                                                                                                 // Usually standard trackers use Total - Fiber = Net.
                                                                                                 // Let's pick Total for now to be safe, or Available if better.
                                                                                                 // Given 'Carboidrato total' is explicit, let's use it.
          gorduras: getNutrient('Lipídios')
        };
      })
      .filter(item => item.nome && item.nome.trim() !== '');

    console.log(`Processed ${processedData.length} valid items.`);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(processedData, null, 2));
    console.log(`Database saved to ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fetchAndProcess();
