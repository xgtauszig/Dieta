import Fuse from 'fuse.js';
import { dbActions, type Food } from '../db';

export interface SearchResult extends Food {
  origin: 'taco' | 'user';
}

let tacoFoods: any[] | null = null;
let fuseTaco: Fuse<any> | null = null;

const loadTacoData = async () => {
  if (tacoFoods) return;

  try {
    console.log("Loading TACO data...");
    // Dynamic import allows Vite/Rollup to chunk this large JSON file
    // and load it only when needed.
    const module = await import('../data/taco_food_db.json');
    console.log("TACO data module loaded", module);
    // The JSON module usually exports the content as default or directly if using certain configs.
    // With standard JSON import, 'module.default' or 'module' holds the array.
    tacoFoods = module.default || module;

    // Ensure it's an array
    if (!Array.isArray(tacoFoods)) {
       // Sometimes it might be wrapped differently depending on tsconfig 'resolveJsonModule'
       if (Array.isArray((tacoFoods as any).default)) {
         tacoFoods = (tacoFoods as any).default;
       } else {
         // Fallback if structure is unexpected
         tacoFoods = Object.values(tacoFoods);
       }
    }

    if (!Array.isArray(tacoFoods)) {
      console.error("TACO data is not an array", tacoFoods);
      tacoFoods = [];
      return;
    }

    fuseTaco = new Fuse(tacoFoods, {
      keys: ['description'],
      threshold: 0.4,
      ignoreLocation: true
    });
    console.log("Fuse initialized with TACO data");
  } catch (error) {
    console.error("Failed to load TACO data", error);
  }
};

export const searchFoods = async (query: string): Promise<SearchResult[]> => {
  await loadTacoData();

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

  const tacoResults = fuseTaco?.search(query).map(result => {
    const item = result.item;
    return {
      id: item.id,
      name: item.description,
      unit: 'g',
      baseQuantity: 100,
      caloriesPerUnit: typeof item.energy_kcal === 'number' ? item.energy_kcal : 0,
      protein: typeof item.protein_g === 'number' ? item.protein_g : 0,
      carbohydrate: typeof item.carbohydrate_g === 'number' ? item.carbohydrate_g : 0,
      lipid: typeof item.lipid_g === 'number' ? item.lipid_g : 0,
      origin: 'taco' as const
    };
  }) || [];

  return [...userResults, ...tacoResults];
};
