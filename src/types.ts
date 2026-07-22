export interface FoodItem {
  item: string;
  portion: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export type MealType = string;

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  mealType: MealType;
  mealName: string;
  description?: string;
  imageUrl?: string;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  dieticianFeedback: string;
  micronutrientHighlights: string[];
  isFirstMealOfDay?: boolean;
  isLastMealOfDay?: boolean;
}

export interface DailyGoals {
  dailyCalories: number;
  dailyProteinGrams: number;
  dailyCarbsGrams: number;
  dailyFatGrams: number;
  dailyFiberGrams: number;
  waterMlGoal: number;
  customDocumentText?: string;
  goalNotes?: string;
}

export interface DaySummaryFeedback {
  overallRating: 'Optimal' | 'Good Progress' | 'Needs Adjustment' | 'High Calorie Surplus';
  headline: string;
  calorieComparison: string;
  macroBalanceFeedback: string;
  actionableTips: string[];
  recommendedNextSteps: string;
}

export interface WaterEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: number;
}

export interface BurnEntry {
  id: string;
  date: string; // YYYY-MM-DD
  activityName?: string;
  caloriesBurned: number;
  timestamp: number;
}

export interface FastingState {
  isFasting: boolean;
  startTime: number | null; // epoch timestamp for fast start
  eatingWindowStartTime?: number | null; // epoch timestamp for eating window start (first meal)
  targetHours: number; // default e.g. 16
  protocolName: string; // e.g. '16:8 Fast'
}

export interface FastingLog {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: number;
  endTime: number;
  durationHours: number;
  targetHours: number;
  protocolName: string;
}

