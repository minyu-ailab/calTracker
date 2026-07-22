import React from 'react';
import { MealEntry, DailyGoals } from '../types';
import { Droplet, Flame, Dumbbell, Wheat, Zap, Leaf, Plus, Minus, Info } from 'lucide-react';

interface DailyMacroSummaryProps {
  meals: MealEntry[];
  goals: DailyGoals;
  waterTotalMl: number;
  onAddWater: (amountMl: number) => void;
  onOpenGoalsModal: () => void;
  burnTotalCalories?: number;
  onOpenBurnModal?: () => void;
}

export const DailyMacroSummary: React.FC<DailyMacroSummaryProps> = ({
  meals,
  goals,
  waterTotalMl,
  onAddWater,
  onOpenGoalsModal,
  burnTotalCalories = 0,
  onOpenBurnModal,
}) => {
  // Calculate running totals
  const totalCal = meals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const totalProt = meals.reduce((acc, m) => acc + (m.totalProteinGrams || 0), 0);
  const totalCarb = meals.reduce((acc, m) => acc + (m.totalCarbsGrams || 0), 0);
  const totalFat = meals.reduce((acc, m) => acc + (m.totalFatGrams || 0), 0);
  const totalFib = meals.reduce((acc, m) => acc + (m.totalFiberGrams || 0), 0);

  const calGoal = goals.dailyCalories || 2000;
  const protGoal = goals.dailyProteinGrams || 150;
  const carbGoal = goals.dailyCarbsGrams || 200;
  const fatGoal = goals.dailyFatGrams || 65;
  const fibGoal = goals.dailyFiberGrams || 30;
  const waterGoal = goals.waterMlGoal || 2500;

  const calPercent = Math.min(Math.round((totalCal / calGoal) * 100), 150);
  const protPercent = Math.min(Math.round((totalProt / protGoal) * 100), 150);
  const carbPercent = Math.min(Math.round((totalCarb / carbGoal) * 100), 150);
  const fatPercent = Math.min(Math.round((totalFat / fatGoal) * 100), 150);
  const fibPercent = Math.min(Math.round((totalFib / fibGoal) * 100), 150);
  const waterPercent = Math.min(Math.round((waterTotalMl / waterGoal) * 100), 150);

  const calRemaining = calGoal - totalCal;

  return (
    <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-6 card-shadow text-[#2F362F]">
      
      {/* Top Banner: Calorie Ring & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Calorie Focus Box */}
        <div className="lg:col-span-5 bg-[#F5F5F0] p-5 rounded-2xl border border-[#5A5A40]/10 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A40]">
                <Flame className="w-4 h-4 text-[#D4A373]" />
                <span>Calories Consumed</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold font-serif-title text-[#1A1A1A]">
                  {Math.round(totalCal).toLocaleString()}
                </span>
                <span className="text-sm font-medium text-[#5A5A40]/70 font-serif-title italic">
                  / {calGoal.toLocaleString()} kcal
                </span>
              </div>
            </div>

            {/* Calorie Ring Gauge */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#E6E6DF]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={calPercent > 105 ? 'text-rose-600' : 'text-[#5A5A40]'}
                  strokeDasharray={`${Math.min(calPercent, 100)}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm font-bold font-serif-title text-[#1A1A1A]">{calPercent}%</span>
                <span className="text-[8px] text-[#5A5A40]/70 uppercase tracking-wider font-semibold">Target</span>
              </div>
            </div>
          </div>

          {/* Calorie Burn Row */}
          <div className="pt-3 border-t border-[#5A5A40]/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#D4A373]/20 text-[#D4A373] font-bold">
                <Flame className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block">
                  Calorie Burn
                </span>
                <span className="text-sm font-bold font-serif-title text-[#1A1A1A]">
                  {Math.round(burnTotalCalories)} <span className="text-xs font-normal text-[#5A5A40]">kcal burned</span>
                </span>
              </div>
            </div>

            <button
              onClick={onOpenBurnModal}
              className="flex items-center gap-1 bg-[#5A5A40] hover:opacity-90 text-white px-3 py-1.5 rounded-xl font-medium text-xs transition-opacity shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Burn</span>
            </button>
          </div>
        </div>


        {/* Macronutrient Bars */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Protein */}
          <div className="bg-[#F5F5F0] p-4 rounded-2xl border border-[#5A5A40]/10">
            <div className="flex items-center justify-between text-xs uppercase tracking-tight font-semibold text-[#5A5A40] mb-1.5">
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-[#5A5A40]" /> Protein
              </span>
              <span className="text-[11px] text-[#5A5A40]/70">{protPercent}%</span>
            </div>
            <div className="text-lg font-bold font-serif-title text-[#1A1A1A]">
              {Math.round(totalProt)}g
            </div>
            <div className="text-[11px] text-[#5A5A40]/70">Goal: {protGoal}g</div>
            <div className="w-full bg-[#E6E6DF] h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#A3B18A] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(protPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-[#F5F5F0] p-4 rounded-2xl border border-[#5A5A40]/10">
            <div className="flex items-center justify-between text-xs uppercase tracking-tight font-semibold text-[#5A5A40] mb-1.5">
              <span className="flex items-center gap-1">
                <Wheat className="w-3.5 h-3.5 text-[#D4A373]" /> Carbs
              </span>
              <span className="text-[11px] text-[#5A5A40]/70">{carbPercent}%</span>
            </div>
            <div className="text-lg font-bold font-serif-title text-[#1A1A1A]">
              {Math.round(totalCarb)}g
            </div>
            <div className="text-[11px] text-[#5A5A40]/70">Goal: {carbGoal}g</div>
            <div className="w-full bg-[#E6E6DF] h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#D4A373] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(carbPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="bg-[#F5F5F0] p-4 rounded-2xl border border-[#5A5A40]/10">
            <div className="flex items-center justify-between text-xs uppercase tracking-tight font-semibold text-[#5A5A40] mb-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#5A5A40]" /> Fat
              </span>
              <span className="text-[11px] text-[#5A5A40]/70">{fatPercent}%</span>
            </div>
            <div className="text-lg font-bold font-serif-title text-[#1A1A1A]">
              {Math.round(totalFat)}g
            </div>
            <div className="text-[11px] text-[#5A5A40]/70">Goal: {fatGoal}g</div>
            <div className="w-full bg-[#E6E6DF] h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#5A5A40] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(fatPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Fiber */}
          <div className="bg-[#F5F5F0] p-4 rounded-2xl border border-[#5A5A40]/10">
            <div className="flex items-center justify-between text-xs uppercase tracking-tight font-semibold text-[#5A5A40] mb-1.5">
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-[#A3B18A]" /> Fiber
              </span>
              <span className="text-[11px] text-[#5A5A40]/70">{fibPercent}%</span>
            </div>
            <div className="text-lg font-bold font-serif-title text-[#1A1A1A]">
              {Math.round(totalFib)}g
            </div>
            <div className="text-[11px] text-[#5A5A40]/70">Goal: {fibGoal}g</div>
            <div className="w-full bg-[#E6E6DF] h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#A3B18A] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(fibPercent, 100)}%` }}
              />
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Hydration Tracker */}
      <div className="mt-5 pt-4 border-t border-[#5A5A40]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-2xl bg-[#E9EDC9] text-[#5A5A40] border border-[#A3B18A]/30">
            <Droplet className="w-4 h-4 fill-[#A3B18A]/30" />
          </div>
          <div>
            <div className="font-semibold text-[#2F362F] flex items-center gap-2">
              <span className="font-serif-title">Hydration Status</span>
              <span className="text-[11px] font-normal text-[#5A5A40]">
                {(waterTotalMl / 1000).toFixed(1)}L / {(waterGoal / 1000).toFixed(1)}L
              </span>
            </div>
            <div className="w-36 sm:w-48 bg-[#E6E6DF] h-2 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#A3B18A] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(waterPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => onAddWater(250)}
            className="flex items-center gap-1 bg-[#F5F5F0] hover:bg-[#E6E6DF] text-[#5A5A40] px-3 py-1.5 rounded-xl border border-[#5A5A40]/15 font-semibold transition-colors"
          >
            <Plus className="w-3 h-3" /> 250ml
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="flex items-center gap-1 bg-[#F5F5F0] hover:bg-[#E6E6DF] text-[#5A5A40] px-3 py-1.5 rounded-xl border border-[#5A5A40]/15 font-semibold transition-colors"
          >
            <Plus className="w-3 h-3" /> 500ml
          </button>
          {waterTotalMl > 0 && (
            <button
              onClick={() => onAddWater(-250)}
              className="p-1.5 bg-[#F5F5F0] hover:bg-[#E6E6DF] text-[#5A5A40] rounded-xl border border-[#5A5A40]/15 transition-colors"
              title="Remove 250ml"
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
