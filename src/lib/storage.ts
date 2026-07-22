import { MealEntry, DailyGoals, WaterEntry, BurnEntry, FastingState, FastingLog } from '../types';

const STORAGE_KEYS = {
  MEALS: 'ai_dietician_meals_v1',
  GOALS: 'ai_dietician_goals_v1',
  WATER: 'ai_dietician_water_v1',
  BURN: 'ai_dietician_burn_v1',
  FASTING_STATE: 'ai_dietician_fasting_state_v1',
  FASTING_LOGS: 'ai_dietician_fasting_logs_v1',
};



export const DEFAULT_GOALS: DailyGoals = {
  dailyCalories: 1350,
  dailyProteinGrams: 105,
  dailyCarbsGrams: 135,
  dailyFatGrams: 42,
  dailyFiberGrams: 28,
  waterMlGoal: 2500,
  goalNotes: 'Target: 117 lbs for upcoming event (3-Week Plan: 1,350 kcal intake + 250-300 kcal active burn).',
  customDocumentText: `DIET & MACRO TARGET SHEET
Daily Energy Requirement: 2,000 kcal
Macronutrient Targets:
- Protein: 150g (30% total calories) - Focus on lean meats, eggs, fish, Greek yogurt, or plant proteins.
- Carbohydrates: 200g (40% total calories) - Focus on complex carbohydrates (oats, sweet potato, brown rice, quinoa, fruit).
- Dietary Fat: 65g (30% total calories) - Prioritize unsaturated fats (olive oil, avocado, nuts, seeds).
- Fiber: 30g minimum per day for gut health and satiety.
Hydration Goal: 2.5 Liters (2500ml) water daily.`,
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadStoredMeals(): MealEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) return getDefaultInitialMeals();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading meals from storage', e);
    return [];
  }
}

export function saveStoredMeals(meals: MealEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  } catch (e) {
    console.error('Error saving meals to storage', e);
  }
}

export function loadStoredGoals(): DailyGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!raw) return DEFAULT_GOALS;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading goals from storage', e);
    return DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals: DailyGoals): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Error saving goals to storage', e);
  }
}

export function loadStoredWater(): WaterEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATER);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading water logs', e);
    return [];
  }
}

export function saveStoredWater(entries: WaterEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving water logs', e);
  }
}

export function loadStoredBurn(): BurnEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BURN);
    if (!raw) return getDefaultInitialBurn();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading burn logs', e);
    return [];
  }
}

export function saveStoredBurn(entries: BurnEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BURN, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving burn logs', e);
  }
}

function getDefaultInitialBurn(): BurnEntry[] {
  const today = getTodayDateString();
  return [
    {
      id: 'demo-burn-1',
      date: today,
      activityName: 'Morning Jog & Core Workout',
      caloriesBurned: 350,
      timestamp: Date.now() - 3600000 * 5,
    },
  ];
}

export function loadStoredFastingState(): FastingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FASTING_STATE);
    if (!raw) {
      // Default: Fasting active started 14 hours ago for nice preview
      const fourteenHoursAgo = Date.now() - 14 * 3600 * 1000;
      return {
        isFasting: true,
        startTime: fourteenHoursAgo,
        targetHours: 16,
        protocolName: '16:8 Standard',
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading fasting state', e);
    return {
      isFasting: false,
      startTime: null,
      targetHours: 16,
      protocolName: '16:8 Standard',
    };
  }
}

export function saveStoredFastingState(state: FastingState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FASTING_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving fasting state', e);
  }
}

export function loadStoredFastingLogs(): FastingLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FASTING_LOGS);
    if (!raw) return getDefaultInitialFastingLogs();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading fasting logs', e);
    return [];
  }
}

export function saveStoredFastingLogs(logs: FastingLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FASTING_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving fasting logs', e);
  }
}

function getDefaultInitialFastingLogs(): FastingLog[] {
  const today = getTodayDateString();
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  return [
    {
      id: 'fast-log-yesterday',
      date: today,
      startTime: now - dayMs - 16 * 3600 * 1000,
      endTime: now - dayMs,
      durationHours: 16.0,
      targetHours: 16,
      protocolName: '16:8 Standard',
    },
  ];
}



function getDefaultInitialMeals(): MealEntry[] {
  const today = getTodayDateString();
  return [
    {
      id: 'demo-meal-1',
      date: today,
      timestamp: Date.now() - 3600000 * 4,
      mealType: 'breakfast',
      mealName: 'Avocado Egg Toast & Berry Bowl',
      description: '2 poached eggs, 1/2 avocado, 2 slices whole grain sourdough, 1/2 cup fresh blueberries.',
      foodItems: [
        { item: 'Poached Eggs', portion: '2 large eggs', calories: 140, proteinGrams: 12, carbsGrams: 1, fatGrams: 10, fiberGrams: 0 },
        { item: 'Whole Grain Sourdough', portion: '2 slices (70g)', calories: 180, proteinGrams: 7, carbsGrams: 32, fatGrams: 2, fiberGrams: 4 },
        { item: 'Avocado Spread', portion: '1/2 medium (75g)', calories: 120, proteinGrams: 1.5, carbsGrams: 6, fatGrams: 11, fiberGrams: 5 },
        { item: 'Blueberries', portion: '1/2 cup (75g)', calories: 42, proteinGrams: 0.5, carbsGrams: 11, fatGrams: 0.2, fiberGrams: 2 },
      ],
      totalCalories: 482,
      totalProteinGrams: 21,
      totalCarbsGrams: 50,
      totalFatGrams: 23.2,
      totalFiberGrams: 11,
      dieticianFeedback: 'Excellent balance of complex carbohydrates, high-quality egg protein, and heart-healthy monounsaturated fats from avocado. The berries deliver antioxidant protection.',
      micronutrientHighlights: ['Rich in Choline & Lutein', 'High Dietary Fiber (11g)', 'Antioxidant Boost', 'Healthy Monounsaturated Fats'],
    },
    {
      id: 'demo-meal-2',
      date: today,
      timestamp: Date.now() - 3600000 * 1,
      mealType: 'lunch',
      mealName: 'Grilled Chicken Quinoa Salad',
      description: 'Grilled chicken breast with quinoa, cherry tomatoes, cucumber, feta cheese, and olive oil dressing.',
      foodItems: [
        { item: 'Grilled Chicken Breast', portion: '160g cooked', calories: 260, proteinGrams: 48, carbsGrams: 0, fatGrams: 5, fiberGrams: 0 },
        { item: 'Cooked Quinoa', portion: '1 cup (185g)', calories: 222, proteinGrams: 8, carbsGrams: 39, fatGrams: 3.5, fiberGrams: 5 },
        { item: 'Mixed Greens & Veggies', portion: '2 cups', calories: 45, proteinGrams: 2, carbsGrams: 8, fatGrams: 0.5, fiberGrams: 3 },
        { item: 'Olive Oil & Lemon Dressing', portion: '1 tbsp', calories: 119, proteinGrams: 0, carbsGrams: 0, fatGrams: 13.5, fiberGrams: 0 },
      ],
      totalCalories: 646,
      totalProteinGrams: 58,
      totalCarbsGrams: 47,
      totalFatGrams: 22.5,
      totalFiberGrams: 8,
      dieticianFeedback: 'Fantastic post-lunch meal! 58g of complete protein supports muscle recovery, and quinoa provides slow-digesting complex carbs to avoid afternoon brain fog.',
      micronutrientHighlights: ['Lean Muscle Recovery (58g Protein)', 'Magnesium & Iron Source', 'Polyphenol Antioxidants'],
    },
  ];
}
