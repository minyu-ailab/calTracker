import React from 'react';
import { MealEntry, DailyGoals, BurnEntry } from '../types';
import { TrendingUp, Calendar, Flame, Award, Check } from 'lucide-react';

interface HistoryTrendsProps {
  allMeals: MealEntry[];
  goals: DailyGoals;
  onSelectDate: (date: string) => void;
  allBurn?: BurnEntry[];
}

export const HistoryTrends: React.FC<HistoryTrendsProps> = ({
  allMeals,
  goals,
  onSelectDate,
  allBurn = [],
}) => {
  // Generate last 7 days list
  const getLast7Days = () => {
    const days: { dateStr: string; label: string; shortDay: string }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateStr, label, shortDay });
    }
    return days;
  };

  const days7 = getLast7Days();

  // Aggregate daily totals
  const dailyData = days7.map((day) => {
    const dayMeals = allMeals.filter((m) => m.date === day.dateStr);
    const dayBurn = allBurn.filter((b) => b.date === day.dateStr);

    const calories = dayMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
    const burned = dayBurn.reduce((acc, b) => acc + (b.caloriesBurned || 0), 0);
    const protein = dayMeals.reduce((acc, m) => acc + (m.totalProteinGrams || 0), 0);
    const carbs = dayMeals.reduce((acc, m) => acc + (m.totalCarbsGrams || 0), 0);
    const fat = dayMeals.reduce((acc, m) => acc + (m.totalFatGrams || 0), 0);

    return {
      ...day,
      calories,
      burned,
      protein,
      carbs,
      fat,
      mealCount: dayMeals.length,
      hitProteinGoal: protein >= (goals.dailyProteinGrams * 0.9),
      withinCalorieGoal: calories > 0 && calories <= (goals.dailyCalories * 1.1),
    };
  });

  const maxCal = Math.max(
    ...dailyData.map((d) => Math.max(d.calories, d.burned)),
    goals.dailyCalories,
    2200
  );

  const daysWithData = dailyData.filter((d) => d.calories > 0 || d.burned > 0).length;
  const daysHitProtein = dailyData.filter((d) => d.hitProteinGoal).length;

  return (
    <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-6 text-[#2F362F] card-shadow">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#5A5A40]/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white font-bold shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
              Consistency Tracker
            </span>
            <h2 className="text-base sm:text-lg font-bold font-serif-title text-[#1A1A1A]">7-Day Calorie & Active Burn History</h2>
          </div>
        </div>

        {daysWithData > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#E9EDC9] text-[#5A5A40] border border-[#A3B18A]/30 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#5A5A40]" /> Protein Met: {daysHitProtein}/{daysWithData} Days
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="mt-6 pt-2">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-4 items-end h-44 pb-2 border-b border-[#5A5A40]/10 relative">
          
          {/* Target Line overlay */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#5A5A40]/40 z-10 flex items-center justify-end pr-1 pointer-events-none"
            style={{
              bottom: `${(goals.dailyCalories / maxCal) * 100}%`,
            }}
          >
            <span className="text-[10px] font-bold text-[#5A5A40] bg-[#F5F5F0] px-2 py-0.5 rounded-full border border-[#5A5A40]/20 shadow-xs">
              Goal: {goals.dailyCalories} kcal
            </span>
          </div>

          {dailyData.map((d) => {
            const intakeHeightPercent = Math.min(Math.round((d.calories / maxCal) * 100), 100);
            const burnHeightPercent = Math.min(Math.round((d.burned / maxCal) * 100), 100);

            return (
              <div
                key={d.dateStr}
                onClick={() => onSelectDate(d.dateStr)}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A1A] text-white text-[10px] p-2.5 rounded-2xl border border-[#5A5A40]/30 absolute -top-16 z-20 pointer-events-none shadow-xl text-center whitespace-nowrap">
                  <div className="font-bold font-serif-title text-amber-200">{d.label}</div>
                  <div>Intake: <span className="font-bold">{Math.round(d.calories)} kcal</span></div>
                  <div>Burned: <span className="font-bold text-[#D4A373]">{Math.round(d.burned)} kcal</span></div>
                  <div className="text-[#A3B18A]">{Math.round(d.protein)}g Protein</div>
                </div>

                {/* Side-by-side Bars (Intake vs Burn) */}
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Intake Bar */}
                  <div className="w-full max-w-[16px] sm:max-w-[20px] bg-[#E6E6DF] rounded-t-lg overflow-hidden flex flex-col justify-end h-full transition-all group-hover:brightness-105">
                    <div
                      className={`w-full transition-all duration-500 ${
                        d.calories > goals.dailyCalories * 1.1
                          ? 'bg-rose-400'
                          : d.calories >= goals.dailyCalories * 0.8
                          ? 'bg-[#A3B18A]'
                          : 'bg-[#5A5A40]'
                      }`}
                      style={{ height: `${intakeHeightPercent}%` }}
                    />
                  </div>

                  {/* Burn Bar */}
                  <div className="w-full max-w-[16px] sm:max-w-[20px] bg-[#E6E6DF] rounded-t-lg overflow-hidden flex flex-col justify-end h-full transition-all group-hover:brightness-105">
                    <div
                      className="w-full bg-[#D4A373] transition-all duration-500"
                      style={{ height: `${burnHeightPercent}%` }}
                    />
                  </div>
                </div>

                {/* Day Labels */}
                <div className="text-center mt-2">
                  <span className="text-[11px] font-bold text-[#1A1A1A] block">
                    {d.shortDay}
                  </span>
                  <span className="text-[10px] text-[#5A5A40]/60 block font-medium">
                    {d.label.split(' ')[1]}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Legend & Quick Select Note */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-[#5A5A40] gap-2 pt-2">
        <div className="flex flex-wrap items-center gap-3 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A3B18A]" /> Intake (Target)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]" /> Intake (Under Goal)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Intake (Over Goal)
          </span>
          <span className="flex items-center gap-1 font-bold text-[#D4A373]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373]" /> Active Burn
          </span>
        </div>

        <div className="text-[#5A5A40]/70 font-medium italic">
          Click any date to switch & view details
        </div>
      </div>

    </div>
  );
};

