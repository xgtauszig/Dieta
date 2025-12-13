import Fuse from 'fuse.js';
import { dbActions, type Food } from '../db';

export interface SearchResult extends Food {
  origin: 'tbca' | 'user';
}

let tbcaFoods: any[] | null = null;
let fuseTbca: Fuse<any> | null = null;

const loadTbcaData = async () => {
  if (tbcaFoods) return;

  try {
    // Dynamic import allows Vite to bundle this JSON file into a chunk
    const module = await import('../data/tbca_database.json');
    // Handle both default export (if JSON treated as module) and direct import
    const data = module.default || module;
    tbcaFoods = data;

    fuseTbca = new Fuse(tbcaFoods || [], {
      keys: ['nome', 'grupo'],
      threshold: 0.3, // Slightly stricter to avoid garbage results
      ignoreLocation: true
    });
  } catch (error) {
    console.error("Failed to load TBCA data", error);
  }
};

export const searchFoods = async (query: string): Promise<SearchResult[]> => {
  await loadTbcaData();

  const userFoods = await dbActions.getAllFoods();
  const fuseUser = new Fuse(userFoods, {
    keys: ['name'],
    threshold: 0.4,
    ignoreLocation: true
  });

  const userResults = fuseUser.search(query).map(result => ({
    ...result.item,
    origin: 'user' as const
  }));

  const tbcaResults = fuseTbca?.search(query).map(result => {
    const item = result.item;
    // TBCA structure: id, nome, grupo, calorias, proteinas, carboidratos, gorduras (already cleaned by script)
    // baseQuantity: 100, unit: 'g'
    return {
      id: item.id,
      name: item.nome,
      unit: item.unit || 'g',
      baseQuantity: item.baseQuantity || 100,
      caloriesPerUnit: typeof item.calorias === 'number' ? item.calorias : 0,
      protein: typeof item.proteinas === 'number' ? item.proteinas : 0,
      carbohydrate: typeof item.carboidratos === 'number' ? item.carboidratos : 0,
      lipid: typeof item.gorduras === 'number' ? item.gorduras : 0,
      origin: 'tbca' as const
    };
  }) || [];

  // Merge and return. Prioritize user foods.
  return [...userResults, ...tbcaResults];
};
