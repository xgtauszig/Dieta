// src/utils/recipeUtils.ts

export interface Ingredient {
  caloriesPerUnit: number;
  protein?: number;
  carbohydrate?: number;
  lipid?: number;
  quantity: number;
  baseQuantity?: number;
}

export interface RecipeTotals {
  totalCals: number;
  totalProt: number;
  totalCarb: number;
  totalFat: number;
  totalWeight: number;
}

export const calculateRecipeTotals = (ingredients: Ingredient[]): RecipeTotals => {
  let totalCals = 0;
  let totalProt = 0;
  let totalCarb = 0;
  let totalFat = 0;
  let totalWeight = 0;

  ingredients.forEach(ing => {
    // If baseQuantity is missing, assume 100g (TACO/standard) or 1?
    // The previous code in ManageFoods.tsx did:
    // const ratio = ing.quantity / (ing.baseQuantity || 100);
    // So we follow that logic.
    const baseQty = ing.baseQuantity || 100;
    const ratio = ing.quantity / baseQty;

    totalCals += (ing.caloriesPerUnit || 0) * ratio;
    totalProt += (ing.protein || 0) * ratio;
    totalCarb += (ing.carbohydrate || 0) * ratio;
    totalFat += (ing.lipid || 0) * ratio;
    totalWeight += Number(ing.quantity);
  });

  return { totalCals, totalProt, totalCarb, totalFat, totalWeight };
};

export type CalculationMode = 'weight' | 'portions';

export interface NormalizedNutrition {
  unit: string;
  baseQuantity: number;
  caloriesPerUnit: number;
  protein: number;
  carbohydrate: number;
  lipid: number;
}

export const normalizeRecipe = (
  totals: RecipeTotals,
  mode: CalculationMode,
  finalValue: number // Either final weight (g) or number of portions
): NormalizedNutrition => {
  if (mode === 'weight') {
    // Current behavior: Normalize to 100g of final product
    const weight = finalValue || totals.totalWeight;
    if (weight <= 0) {
        // Fallback if weight is 0 to avoid Infinity
        return {
            unit: 'g',
            baseQuantity: 100,
            caloriesPerUnit: 0,
            protein: 0,
            carbohydrate: 0,
            lipid: 0
        };
    }
    const ratio = 100 / weight;

    return {
      unit: 'g',
      baseQuantity: 100,
      caloriesPerUnit: Number((totals.totalCals * ratio).toFixed(1)),
      protein: Number((totals.totalProt * ratio).toFixed(1)),
      carbohydrate: Number((totals.totalCarb * ratio).toFixed(1)),
      lipid: Number((totals.totalFat * ratio).toFixed(1)),
    };
  } else {
    // New behavior: Normalize to 1 portion
    const portions = finalValue || 1;
    const ratio = 1 / portions;

    return {
      unit: 'unid', // Or user custom string can be passed in later, but logic is per 1 unit
      baseQuantity: 1,
      caloriesPerUnit: Number((totals.totalCals * ratio).toFixed(1)),
      protein: Number((totals.totalProt * ratio).toFixed(1)),
      carbohydrate: Number((totals.totalCarb * ratio).toFixed(1)),
      lipid: Number((totals.totalFat * ratio).toFixed(1)),
    };
  }
};
