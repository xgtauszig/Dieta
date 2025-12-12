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
    const response = await fetch('/src/data/taco_food_db.json');
    const data = await response.json();
    tacoFoods = data;

    fuseTaco = new Fuse(tacoFoods || [], {
      keys: ['description'],
      threshold: 0.4,
      ignoreLocation: true
    });
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
    // Map TACO fields to Food interface
    // TACO structure: description, energy_kcal, protein_g, carbohydrate_g, lipid_g, etc.
    // Usually per 100g.
    return {
      id: item.id, // TACO IDs might conflict with User IDs if we are not careful, but here we treat them as ephemeral search results mostly.
                   // Actually, saving them to DB later might create new ID.
                   // For now, let's keep original ID but handle it carefully.
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

  // Merge and return. Prioritize user foods?
  return [...userResults, ...tacoResults];
};
