import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type {
  AppStorageSnapshot,
  AppleHealthConnectionState,
  BurnEntry,
  DailyGoals,
  FastingLog,
  FastingState,
  MealEntry,
  WaterEntry,
} from './src/types';

const dataDirectory = process.env.DATA_DIRECTORY || path.join(process.cwd(), 'data');
mkdirSync(dataDirectory, { recursive: true });

const stateFilePath = path.join(dataDirectory, 'caltracker-state.json');

type StateKey =
  | 'meals'
  | 'goals'
  | 'waterLogs'
  | 'burnLogs'
  | 'fastingState'
  | 'fastingLogs'
  | 'appleHealthConnection';

type PersistedStore = Record<string, AppStorageSnapshot>;

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultGoals(): DailyGoals {
  return {
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
}

function createDefaultFastingState(): FastingState {
  const fourteenHoursAgo = Date.now() - 14 * 3600 * 1000;
  return {
    isFasting: true,
    startTime: fourteenHoursAgo,
    targetHours: 16,
    protocolName: '16:8 Standard',
  };
}

function createDefaultAppleHealthConnection(): AppleHealthConnectionState {
  return {
    isConnected: false,
    appleAccountEmail: '',
  };
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
      durationHours: 16,
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
      timestamp: Date.now() - 3600000,
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

function getDefaultAppState(): AppStorageSnapshot {
  return {
    meals: getDefaultInitialMeals(),
    goals: createDefaultGoals(),
    waterLogs: [],
    burnLogs: getDefaultInitialBurn(),
    fastingState: createDefaultFastingState(),
    fastingLogs: getDefaultInitialFastingLogs(),
    appleHealthConnection: createDefaultAppleHealthConnection(),
  };
}

function readStore(): PersistedStore {
  if (!existsSync(stateFilePath)) {
    return {};
  }

  try {
    const content = readFileSync(stateFilePath, 'utf-8');
    if (!content.trim()) {
      return {};
    }

    return JSON.parse(content) as PersistedStore;
  } catch (error) {
    console.error('Failed to read persisted app state store', error);
    return {};
  }
}

function writeStore(store: PersistedStore): void {
  try {
    writeFileSync(stateFilePath, JSON.stringify(store), 'utf-8');
  } catch (error) {
    console.error('Failed to write persisted app state store', error);
  }
}

function getClientState(clientId: string): AppStorageSnapshot {
  const store = readStore();
  return store[clientId] || getDefaultAppState();
}

function setClientState(clientId: string, nextState: AppStorageSnapshot): void {
  const store = readStore();
  store[clientId] = nextState;
  writeStore(store);
}

function saveStateValue<T>(clientId: string, key: StateKey, value: T): T {
  const current = getClientState(clientId);
  const nextState = {
    ...current,
    [key]: value,
  } as AppStorageSnapshot;

  setClientState(clientId, nextState);
  return value;
}

export function getClientId(request: { header(name: string): string | undefined }): string {
  return request.header('x-client-id')?.trim() || 'anonymous';
}

export function getDatabaseInfo() {
  return {
    dataDirectory,
    databasePath: stateFilePath,
  };
}

export function loadAppState(clientId: string): AppStorageSnapshot {
  return getClientState(clientId);
}

export function saveAppState(clientId: string, state: AppStorageSnapshot): AppStorageSnapshot {
  setClientState(clientId, state);
  return getClientState(clientId);
}

export function saveMeals(clientId: string, meals: MealEntry[]): MealEntry[] {
  return saveStateValue(clientId, 'meals', meals);
}

export function saveGoals(clientId: string, goals: DailyGoals): DailyGoals {
  return saveStateValue(clientId, 'goals', goals);
}

export function saveWaterLogs(clientId: string, waterLogs: WaterEntry[]): WaterEntry[] {
  return saveStateValue(clientId, 'waterLogs', waterLogs);
}

export function saveBurnLogs(clientId: string, burnLogs: BurnEntry[]): BurnEntry[] {
  return saveStateValue(clientId, 'burnLogs', burnLogs);
}

export function saveFastingState(clientId: string, fastingState: FastingState): FastingState {
  return saveStateValue(clientId, 'fastingState', fastingState);
}

export function saveFastingLogs(clientId: string, fastingLogs: FastingLog[]): FastingLog[] {
  return saveStateValue(clientId, 'fastingLogs', fastingLogs);
}

export function saveAppleHealthConnection(
  clientId: string,
  connectionState: AppleHealthConnectionState
): AppleHealthConnectionState {
  return saveStateValue(clientId, 'appleHealthConnection', connectionState);
}
