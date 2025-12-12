// src/utils/recipeUtils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateRecipeTotals, normalizeRecipe, type Ingredient } from './recipeUtils';

describe('Recipe Calculations', () => {
  // Mock Ingredients
  // Ingredient A: 100kcal per 100g. Using 200g. -> 200kcal
  // Ingredient B: 50kcal per 100g. Using 100g. -> 50kcal
  // Total Raw: 300kcal. Total Raw Weight: 300g.

  const ingredients: Ingredient[] = [
    {
      name: 'Ing A', // optional in interface but useful for reading
      quantity: 200,
      baseQuantity: 100,
      caloriesPerUnit: 100,
      protein: 10,
      carbohydrate: 20,
      lipid: 5,
    } as any,
    {
      name: 'Ing B',
      quantity: 100,
      baseQuantity: 100,
      caloriesPerUnit: 50,
      protein: 5,
      carbohydrate: 10,
      lipid: 2,
    } as any
  ];

  it('calculates total correctly', () => {
    const totals = calculateRecipeTotals(ingredients);

    // Ing A: 200g * (100kcal/100g) = 200 kcal
    // Ing B: 100g * (50kcal/100g) = 50 kcal
    // Total: 250 kcal

    // Prot A: 200g * (10/100) = 20
    // Prot B: 100g * (5/100) = 5
    // Total: 25

    expect(totals.totalCals).toBe(250);
    expect(totals.totalProt).toBe(25);
    expect(totals.totalWeight).toBe(300);
  });

  it('normalizes by weight (cooked reduction)', () => {
    const totals = calculateRecipeTotals(ingredients);
    // Suppose cooked weight reduces to 250g
    // We want nutrition per 100g of cooked product.
    // Total energy in pot: 250 kcal.
    // Density: 1 kcal / g.
    // Per 100g: 100 kcal.

    const normalized = normalizeRecipe(totals, 'weight', 250);

    expect(normalized.unit).toBe('g');
    expect(normalized.baseQuantity).toBe(100);
    expect(normalized.caloriesPerUnit).toBe(100);

    // Check protein density increase
    // Total Prot: 25g in 250g product.
    // Per 100g: 10g.
    expect(normalized.protein).toBe(10);
  });

  it('normalizes by weight (no change/default)', () => {
    const totals = calculateRecipeTotals(ingredients);
    // 300g total.
    // Per 100g: 250kcal / 3 = 83.333...

    const normalized = normalizeRecipe(totals, 'weight', 300);

    expect(normalized.caloriesPerUnit).toBe(83.3); // toFixed(1)
  });

  it('normalizes by portions', () => {
    const totals = calculateRecipeTotals(ingredients);
    // Total 250 kcal.
    // Make 2 portions.
    // Per portion: 125 kcal.

    const normalized = normalizeRecipe(totals, 'portions', 2);

    expect(normalized.unit).toBe('unid');
    expect(normalized.baseQuantity).toBe(1);
    expect(normalized.caloriesPerUnit).toBe(125);
    expect(normalized.protein).toBe(12.5);
  });
});
