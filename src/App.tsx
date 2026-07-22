import React, { useState, useEffect } from 'react';
import { MealEntry, DailyGoals, WaterEntry, BurnEntry, FastingState, FastingLog } from './types';
import {
  createDefaultFastingState,
  DEFAULT_GOALS,
  loadStoredAppState,
  saveStoredMeals,
  saveStoredGoals,
  saveStoredWater,
  saveStoredBurn,
  saveStoredFastingState,
  saveStoredFastingLogs,
  getTodayDateString,
} from './lib/storage';
import { Header } from './components/Header';
import { DailyMacroSummary } from './components/DailyMacroSummary';
import { MealCard } from './components/MealCard';
import { MealLogger } from './components/MealLogger';
import { GoalsModal } from './components/GoalsModal';
import { DieticianAdviceCard } from './components/DieticianAdviceCard';
import { HistoryTrends } from './components/HistoryTrends';
import { BurnLoggerModal } from './components/BurnLoggerModal';
import { FastingTrackerCard } from './components/FastingTrackerCard';
import { AppleHealthConnectModal } from './components/AppleHealthConnectModal';
import { Plus, Utensils, FileText, Sparkles, Droplet, ArrowUpRight } from 'lucide-react';

export default function App() {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Storage states
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [waterLogs, setWaterLogs] = useState<WaterEntry[]>([]);
  const [burnLogs, setBurnLogs] = useState<BurnEntry[]>([]);
  const [fastingState, setFastingState] = useState<FastingState>(createDefaultFastingState());
  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>([]);

  // Modal open states
  const [isMealLoggerOpen, setIsMealLoggerOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [isAppleHealthModalOpen, setIsAppleHealthModalOpen] = useState(false);

  // Initial load
  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const state = await loadStoredAppState();
        if (isCancelled) {
          return;
        }

        setMeals(state.meals);
        setGoals(state.goals);
        setWaterLogs(state.waterLogs);
        setBurnLogs(state.burnLogs);
        setFastingState(state.fastingState);
        setFastingLogs(state.fastingLogs);
      } catch (error) {
        console.error('Failed to load stored app state', error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const persist = (label: string, operation: Promise<unknown>) => {
    void operation.catch((error) => {
      console.error(`Failed to save ${label}`, error);
    });
  };

  const handleUpdateFastingState = (newState: FastingState) => {
    setFastingState(newState);
    persist('fasting state', saveStoredFastingState(newState));
  };

  const handleLogCompletedFast = (newLog: FastingLog) => {
    const updated = [newLog, ...fastingLogs];
    setFastingLogs(updated);
    persist('fasting logs', saveStoredFastingLogs(updated));
  };


  const handleOpenNewMeal = () => {
    setEditingMeal(null);
    setIsMealLoggerOpen(true);
  };

  const handleOpenEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal);
    setIsMealLoggerOpen(true);
  };

  // Save meal and auto-adjust Intermittent Fasting
  const handleSaveMeal = (newMeal: MealEntry) => {
    const existingIndex = meals.findIndex((m) => m.id === newMeal.id);
    let updated: MealEntry[];
    if (existingIndex >= 0) {
      updated = [...meals];
      updated[existingIndex] = newMeal;
    } else {
      updated = [newMeal, ...meals];
    }
    setMeals(updated);
    persist('meals', saveStoredMeals(updated));
    setEditingMeal(null);

    // Auto adjust Intermittent Fasting timer
    if (newMeal.isFirstMealOfDay) {
      const endTime = newMeal.timestamp || Date.now();

      // If user was actively fasting, calculate completed duration & save log
      if (fastingState.isFasting && fastingState.startTime) {
        const startTime = fastingState.startTime;
        const durationMs = Math.max(0, endTime - startTime);
        const durationHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(1));

        const completedLog: FastingLog = {
          id: 'fast-' + Date.now(),
          date: newMeal.date,
          startTime,
          endTime,
          durationHours,
          targetHours: fastingState.targetHours || 16,
          protocolName: fastingState.protocolName || '16:8 Fast',
        };

        handleLogCompletedFast(completedLog);
      }

      // Close fasting window (user is now in eating window)
      handleUpdateFastingState({
        ...fastingState,
        isFasting: false,
        startTime: null,
      });
    } else if (newMeal.isLastMealOfDay) {
      // User finished eating, start fasting timer from this meal time
      const startTime = newMeal.timestamp || Date.now();
      handleUpdateFastingState({
        ...fastingState,
        isFasting: true,
        startTime,
      });
    }
  };

  const handleDeleteMeal = (id: string) => {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);
    persist('meals', saveStoredMeals(updated));
  };

  const handleSaveGoals = (newGoals: DailyGoals) => {
    setGoals(newGoals);
    persist('goals', saveStoredGoals(newGoals));
  };

  const handleSaveBurn = (newBurn: BurnEntry) => {
    const updated = [newBurn, ...burnLogs];
    setBurnLogs(updated);
    persist('burn logs', saveStoredBurn(updated));
  };

  const handleDeleteBurn = (id: string) => {
    const updated = burnLogs.filter((b) => b.id !== id);
    setBurnLogs(updated);
    persist('burn logs', saveStoredBurn(updated));
  };

  const handleAddWater = (amountMl: number) => {
    const existing = waterLogs.filter((w) => w.date === selectedDate);
    const currentTotal = existing.reduce((sum, w) => sum + w.amountMl, 0);
    const newTotal = Math.max(0, currentTotal + amountMl);

    const otherDateLogs = waterLogs.filter((w) => w.date !== selectedDate);
    const updated = [
      ...otherDateLogs,
      {
        id: 'water-' + Date.now(),
        date: selectedDate,
        amountMl: newTotal,
        timestamp: Date.now(),
      },
    ];

    setWaterLogs(updated);
    persist('water logs', saveStoredWater(updated));
  };

  const handleImportAppleBurnEntries = (newEntries: BurnEntry[]) => {
    const updated = [...newEntries, ...burnLogs];
    setBurnLogs(updated);
    persist('burn logs', saveStoredBurn(updated));
  };

  // Filtered for selected date
  const selectedDateMeals = meals.filter((m) => m.date === selectedDate);
  const selectedDateWaterTotal = waterLogs
    .filter((w) => w.date === selectedDate)
    .reduce((sum, w) => sum + w.amountMl, 0);
  
  const selectedDateBurnEntries = burnLogs.filter((b) => b.date === selectedDate);
  const selectedDateBurnTotal = selectedDateBurnEntries.reduce(
    (sum, b) => sum + b.caloriesBurned,
    0
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#2F362F] font-sans antialiased selection:bg-[#A3B18A]/40 selection:text-[#1A1A1A]">
      
      {/* Header Bar */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenMealLogger={handleOpenNewMeal}
        onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
        onOpenSynthesis={() => {
          const el = document.getElementById('daily-synthesis-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAppleHealthModal={() => setIsAppleHealthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Daily Macronutrient Dashboard Gauge */}
        <DailyMacroSummary
          meals={selectedDateMeals}
          goals={goals}
          waterTotalMl={selectedDateWaterTotal}
          onAddWater={handleAddWater}
          onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
          burnTotalCalories={selectedDateBurnTotal}
          onOpenBurnModal={() => setIsBurnModalOpen(true)}
        />

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Meal Logs */}
          <section className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
                  Intake Timeline
                </span>
                <h2 className="text-lg font-bold font-serif-title text-[#1A1A1A] flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#5A5A40]" />
                  <span>Logged Meals ({selectedDateMeals.length})</span>
                </h2>
              </div>

              <button
                onClick={handleOpenNewMeal}
                className="flex items-center gap-1.5 text-xs font-medium bg-[#5A5A40] hover:opacity-90 text-white px-4 py-2.5 rounded-2xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Log Meal</span>
              </button>
            </div>

            {selectedDateMeals.length === 0 ? (
              <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-8 text-center space-y-3 card-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] border border-[#5A5A40]/15 flex items-center justify-center text-[#5A5A40] mx-auto">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-serif-title text-[#1A1A1A]">No Meals Logged For This Date</h3>
                <p className="text-xs text-[#5A5A40]/70 max-w-sm mx-auto">
                  Snap a picture of your food or type a short description to get calorie and macronutrient estimates with dietician advice.
                </p>
                <button
                  onClick={handleOpenNewMeal}
                  className="inline-flex items-center gap-2 text-xs font-medium bg-[#5A5A40] text-white hover:opacity-90 px-4 py-2.5 rounded-2xl transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log First Meal Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onDeleteMeal={handleDeleteMeal}
                    onEditMeal={handleOpenEditMeal}
                  />
                ))}
              </div>
            )}

            {/* Attached Goals Document Banner */}
            <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-5 flex items-center justify-between gap-4 card-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-serif-title text-[#1A1A1A]">Active Goals & Diet Plan</h4>
                  <p className="text-[11px] text-[#5A5A40]/80 line-clamp-1">
                    {goals.goalNotes || goals.customDocumentText?.slice(0, 60) || 'Target: 2,000 kcal, 150g protein...'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsGoalsModalOpen(true)}
                className="text-xs font-bold text-[#5A5A40] hover:text-[#1A1A1A] bg-[#A3B18A]/20 hover:bg-[#A3B18A]/30 px-3.5 py-2 rounded-2xl border border-[#A3B18A]/30 transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <span>Edit Targets</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </section>

          {/* Right Column: AI Dietician Synthesis, Fasting & Trends */}
          <section className="lg:col-span-5 space-y-6" id="daily-synthesis-section">
            
            {/* Intermittent Fasting Tracker */}
            <FastingTrackerCard
              fastingState={fastingState}
              fastingLogs={fastingLogs}
              onUpdateState={handleUpdateFastingState}
              onLogCompletedFast={handleLogCompletedFast}
              selectedDate={selectedDate}
              meals={meals}
            />

            {/* Daily AI Dietician Synthesis Card */}
            <DieticianAdviceCard
              meals={selectedDateMeals}
              goals={goals}
              selectedDate={selectedDate}
            />

            {/* 7-Day History & Macro Trends */}
            <HistoryTrends
              allMeals={meals}
              goals={goals}
              onSelectDate={(d) => setSelectedDate(d)}
              allBurn={burnLogs}
            />

          </section>


        </div>

      </main>

      {/* Modals */}
      <MealLogger
        isOpen={isMealLoggerOpen}
        onClose={() => {
          setIsMealLoggerOpen(false);
          setEditingMeal(null);
        }}
        onSaveMeal={handleSaveMeal}
        selectedDate={selectedDate}
        goals={goals}
        existingMealsCount={selectedDateMeals.length}
        editingMeal={editingMeal}
      />

      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        goals={goals}
        onSaveGoals={handleSaveGoals}
      />

      <BurnLoggerModal
        isOpen={isBurnModalOpen}
        onClose={() => setIsBurnModalOpen(false)}
        onSaveBurn={handleSaveBurn}
        selectedDate={selectedDate}
        todayBurnEntries={selectedDateBurnEntries}
        onDeleteBurn={handleDeleteBurn}
        onOpenAppleHealthModal={() => setIsAppleHealthModalOpen(true)}
      />

      <AppleHealthConnectModal
        isOpen={isAppleHealthModalOpen}
        onClose={() => setIsAppleHealthModalOpen(false)}
        onImportBurnEntries={handleImportAppleBurnEntries}
      />

    </div>
  );
}

