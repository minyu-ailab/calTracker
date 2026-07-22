import {
  AppStorageSnapshot,
  AppleHealthConnectionState,
  BurnEntry,
  DailyGoals,
  FastingLog,
  FastingState,
  MealEntry,
  WaterEntry,
} from '../types';

const STORAGE_KEYS = {
  MEALS: 'ai_dietician_meals_v1',
  GOALS: 'ai_dietician_goals_v1',
  WATER: 'ai_dietician_water_v1',
  BURN: 'ai_dietician_burn_v1',
  FASTING_STATE: 'ai_dietician_fasting_state_v1',
  FASTING_LOGS: 'ai_dietician_fasting_logs_v1',
  CLIENT_ID: 'ai_dietician_client_id_v1',
  MIGRATION_COMPLETE: 'ai_dietician_storage_migrated_v2',
  APPLE_HEALTH_CONNECTED: 'apple_health_connected',
  APPLE_ACCOUNT_EMAIL: 'apple_account_email',
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

export const DEFAULT_APPLE_HEALTH_CONNECTION: AppleHealthConnectionState = {
  isConnected: false,
  appleAccountEmail: '',
};

export function createDefaultFastingState(): FastingState {
  const fourteenHoursAgo = Date.now() - 14 * 3600 * 1000;
  return {
    isFasting: true,
    startTime: fourteenHoursAgo,
    targetHours: 16,
    protocolName: '16:8 Standard',
  };
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getClientId(): string {
  if (!isBrowser()) {
    return 'server';
  }

  try {
    const existingClientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    if (existingClientId) {
      return existingClientId;
    }

    const generatedClientId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `client-${crypto.randomUUID()}`
      : `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, generatedClientId);
    return generatedClientId;
  } catch (e) {
    console.error('Error loading client id', e);
    return 'anonymous';
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-client-id', getClientId());

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed for ${url}`);
  }

  return response.json() as Promise<T>;
}

function loadLegacyMeals(): MealEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) return getDefaultInitialMeals();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading meals from local storage', e);
    return getDefaultInitialMeals();
  }
}

function loadLegacyGoals(): DailyGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!raw) return DEFAULT_GOALS;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading goals from local storage', e);
    return DEFAULT_GOALS;
  }
}

function loadLegacyWater(): WaterEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATER);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading water logs from local storage', e);
    return [];
  }
}

function loadLegacyBurn(): BurnEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BURN);
    if (!raw) return getDefaultInitialBurn();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading burn logs from local storage', e);
    return getDefaultInitialBurn();
  }
}

function loadLegacyFastingState(): FastingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FASTING_STATE);
    if (!raw) return createDefaultFastingState();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading fasting state from local storage', e);
    return {
      isFasting: false,
      startTime: null,
      targetHours: 16,
      protocolName: '16:8 Standard',
    };
  }
}

function loadLegacyFastingLogs(): FastingLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FASTING_LOGS);
    if (!raw) return getDefaultInitialFastingLogs();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading fasting logs from local storage', e);
    return getDefaultInitialFastingLogs();
  }
}

function loadLegacyAppleHealthConnection(): AppleHealthConnectionState {
  try {
    return {
      isConnected: localStorage.getItem(STORAGE_KEYS.APPLE_HEALTH_CONNECTED) === 'true',
      appleAccountEmail: localStorage.getItem(STORAGE_KEYS.APPLE_ACCOUNT_EMAIL) || '',
    };
  } catch (e) {
    console.error('Error loading Apple Health connection from local storage', e);
    return DEFAULT_APPLE_HEALTH_CONNECTION;
  }
}

function hasLegacyStorageData(): boolean {
  if (!isBrowser()) {
    return false;
  }

  return [
    STORAGE_KEYS.MEALS,
    STORAGE_KEYS.GOALS,
    STORAGE_KEYS.WATER,
    STORAGE_KEYS.BURN,
    STORAGE_KEYS.FASTING_STATE,
    STORAGE_KEYS.FASTING_LOGS,
    STORAGE_KEYS.APPLE_HEALTH_CONNECTED,
    STORAGE_KEYS.APPLE_ACCOUNT_EMAIL,
  ].some((storageKey) => localStorage.getItem(storageKey) !== null);
}

function getLegacyAppState(): AppStorageSnapshot {
  return {
    meals: loadLegacyMeals(),
    goals: loadLegacyGoals(),
    waterLogs: loadLegacyWater(),
    burnLogs: loadLegacyBurn(),
    fastingState: loadLegacyFastingState(),
    fastingLogs: loadLegacyFastingLogs(),
    appleHealthConnection: loadLegacyAppleHealthConnection(),
  };
}

export function getDefaultAppState(): AppStorageSnapshot {
  return {
    meals: getDefaultInitialMeals(),
    goals: DEFAULT_GOALS,
    waterLogs: [],
    burnLogs: getDefaultInitialBurn(),
    fastingState: createDefaultFastingState(),
    fastingLogs: getDefaultInitialFastingLogs(),
    appleHealthConnection: DEFAULT_APPLE_HEALTH_CONNECTION,
  };
}

export async function loadStoredAppState(): Promise<AppStorageSnapshot> {
  try {
    const serverState = await requestJson<AppStorageSnapshot>('/api/storage');

    if (isBrowser() && hasLegacyStorageData() && !localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETE)) {
      const migratedState = await saveStoredAppState(getLegacyAppState());
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, 'true');
      return migratedState;
    }

    return serverState;
  } catch (e) {
    console.error('Error loading app state from server', e);
    return getDefaultAppState();
  }
}

export function saveStoredAppState(state: AppStorageSnapshot): Promise<AppStorageSnapshot> {
  return requestJson<AppStorageSnapshot>('/api/storage', {
    method: 'PUT',
    body: JSON.stringify(state),
  });
}

export function saveStoredMeals(meals: MealEntry[]): Promise<MealEntry[]> {
  return requestJson<MealEntry[]>('/api/storage/meals', {
    method: 'PUT',
    body: JSON.stringify(meals),
  });
}

export function saveStoredGoals(goals: DailyGoals): Promise<DailyGoals> {
  return requestJson<DailyGoals>('/api/storage/goals', {
    method: 'PUT',
    body: JSON.stringify(goals),
  });
}

export function saveStoredWater(entries: WaterEntry[]): Promise<WaterEntry[]> {
  return requestJson<WaterEntry[]>('/api/storage/water', {
    method: 'PUT',
    body: JSON.stringify(entries),
  });
}

export function saveStoredBurn(entries: BurnEntry[]): Promise<BurnEntry[]> {
  return requestJson<BurnEntry[]>('/api/storage/burn', {
    method: 'PUT',
    body: JSON.stringify(entries),
  });
}

export function saveStoredFastingState(state: FastingState): Promise<FastingState> {
  return requestJson<FastingState>('/api/storage/fasting-state', {
    method: 'PUT',
    body: JSON.stringify(state),
  });
}

export function saveStoredFastingLogs(logs: FastingLog[]): Promise<FastingLog[]> {
  return requestJson<FastingLog[]>('/api/storage/fasting-logs', {
    method: 'PUT',
    body: JSON.stringify(logs),
  });
}

export function loadAppleHealthConnection(): Promise<AppleHealthConnectionState> {
  return requestJson<AppleHealthConnectionState>('/api/storage/apple-health');
}

export function saveAppleHealthConnection(
  connectionState: AppleHealthConnectionState
): Promise<AppleHealthConnectionState> {
  return requestJson<AppleHealthConnectionState>('/api/storage/apple-health', {
    method: 'PUT',
    body: JSON.stringify(connectionState),
  });
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
