import React, { useState, useEffect } from 'react';
import { FastingState, FastingLog, MealEntry } from '../types';
import { Timer, Play, Square, Edit3, Zap, Sun, Moon, CheckCircle2 } from 'lucide-react';

interface FastingTrackerCardProps {
  fastingState: FastingState;
  fastingLogs: FastingLog[];
  onUpdateState: (newState: FastingState) => void;
  onLogCompletedFast: (log: FastingLog) => void;
  selectedDate: string;
  meals?: MealEntry[];
}

const FASTING_PROTOCOLS = [
  { name: '16:8 Standard', targetHours: 16, desc: '16h fast / 8h eating window' },
  { name: '14:10 Gentle', targetHours: 14, desc: '14h fast / 10h eating window' },
  { name: '18:6 Intermediate', targetHours: 18, desc: '18h fast / 6h eating window' },
  { name: '20:4 Warrior', targetHours: 20, desc: '20h fast / 4h eating window' },
];

export const FastingTrackerCard: React.FC<FastingTrackerCardProps> = ({
  fastingState,
  fastingLogs,
  onUpdateState,
  onLogCompletedFast,
  selectedDate,
  meals = [],
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [isAdjustTimeOpen, setIsAdjustTimeOpen] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('08:36');

  // Live timer tick every 1s
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter meals for the selected date
  const dateMeals = meals
    .filter((m) => m.date === selectedDate)
    .sort((a, b) => a.timestamp - b.timestamp);

  const explicitFirstMeal = dateMeals.find((m) => m.isFirstMealOfDay);
  const firstMealOfDate = explicitFirstMeal || dateMeals[0];
  const explicitLastMeal = dateMeals.find((m) => m.isLastMealOfDay);

  // Derive active fasting mode and timestamps
  let isFastingActive = fastingState.isFasting;
  let effectiveFastingStartTime = fastingState.startTime;
  let effectiveEatingWindowStartTime = fastingState.eatingWindowStartTime || (firstMealOfDate ? firstMealOfDate.timestamp : null);

  if (firstMealOfDate) {
    effectiveEatingWindowStartTime = firstMealOfDate.timestamp;
  }

  if (explicitLastMeal) {
    isFastingActive = true;
    effectiveFastingStartTime = explicitLastMeal.timestamp;
  } else if (firstMealOfDate) {
    // If user ate a first meal today (e.g. 8:36 AM), and has not manually started a fast AFTER that meal
    if (fastingState.isFasting && fastingState.startTime && fastingState.startTime > firstMealOfDate.timestamp) {
      isFastingActive = true;
      effectiveFastingStartTime = fastingState.startTime;
    } else {
      // User is currently in eating window!
      isFastingActive = false;
    }
  }

  // Pre-fill time input when time picker opens
  useEffect(() => {
    const activeTs = isFastingActive ? effectiveFastingStartTime : effectiveEatingWindowStartTime;
    if (activeTs) {
      const d = new Date(activeTs);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setCustomTimeInput(`${h}:${m}`);
    }
  }, [isFastingActive, effectiveFastingStartTime, effectiveEatingWindowStartTime]);

  // Fasting mode calculations
  const elapsedFastMs = isFastingActive && effectiveFastingStartTime
    ? Math.max(0, now - effectiveFastingStartTime)
    : 0;

  const elapsedFastSecs = Math.floor(elapsedFastMs / 1000);
  const fastHours = Math.floor(elapsedFastSecs / 3600);
  const fastMinutes = Math.floor((elapsedFastSecs % 3600) / 60);
  const fastSeconds = elapsedFastSecs % 60;

  const targetFastSecs = (fastingState.targetHours || 16) * 3600;
  const fastProgressPercent = Math.min(100, Math.round((elapsedFastSecs / targetFastSecs) * 100));

  // Eating window calculations
  const eatingWindowTargetHours = 24 - (fastingState.targetHours || 16); // e.g. 8 hrs for 16:8
  const eatingWindowEndTime = effectiveEatingWindowStartTime
    ? effectiveEatingWindowStartTime + eatingWindowTargetHours * 3600 * 1000
    : null;

  const elapsedEWMs = effectiveEatingWindowStartTime && !isFastingActive
    ? Math.max(0, now - effectiveEatingWindowStartTime)
    : 0;

  const elapsedEWSecs = Math.floor(elapsedEWMs / 1000);
  const ewHours = Math.floor(elapsedEWSecs / 3600);
  const ewMinutes = Math.floor((elapsedEWSecs % 3600) / 60);
  const ewSeconds = elapsedEWSecs % 60;

  const targetEWSecs = eatingWindowTargetHours * 3600;
  const ewProgressPercent = Math.min(100, Math.round((elapsedEWSecs / targetEWSecs) * 100));

  // Determine Fasting Stage
  const getFastingStage = (hrs: number) => {
    if (hrs < 4) {
      return {
        title: 'Anabolic & Digestion',
        desc: 'Insulin levels elevated; nutrients being absorbed.',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    } else if (hrs < 8) {
      return {
        title: 'Blood Sugar Normalization',
        desc: 'Insulin drops; glycogen breakdown begins.',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    } else if (hrs < 12) {
      return {
        title: 'Fat Burning Phase',
        desc: 'Glycogen depleted; body shifts to burning body fat.',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    } else {
      return {
        title: 'Ketosis & Autophagy',
        desc: 'Peak fat oxidation & cellular repair underway!',
        color: 'bg-[#5A5A40]/15 text-[#1A1A1A] border-[#5A5A40]/30 font-bold',
      };
    }
  };

  const currentStage = getFastingStage(fastHours);

  // Target end timestamp for fast
  const targetEndTimestamp = effectiveFastingStartTime
    ? effectiveFastingStartTime + (fastingState.targetHours || 16) * 3600 * 1000
    : null;

  const formatTimeHHMM = (timestamp: number | null) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Start Fasting (Last Meal finished)
  const handleStartFast = (protocol = FASTING_PROTOCOLS[0], startTimeCustom?: number) => {
    const newState: FastingState = {
      isFasting: true,
      startTime: startTimeCustom || Date.now(),
      eatingWindowStartTime: effectiveEatingWindowStartTime,
      targetHours: protocol.targetHours,
      protocolName: protocol.name,
    };
    onUpdateState(newState);
  };

  // End Fast (Break Fast with First Meal)
  const handleEndFast = (endTimeCustom?: number) => {
    const endTime = endTimeCustom || Date.now();
    const startTime = effectiveFastingStartTime || Date.now() - 16 * 3600 * 1000;
    const duration = (endTime - startTime) / (1000 * 3600);

    const newLog: FastingLog = {
      id: 'fast-' + Date.now(),
      date: selectedDate,
      startTime,
      endTime,
      durationHours: Math.round(duration * 10) / 10,
      targetHours: fastingState.targetHours || 16,
      protocolName: fastingState.protocolName || '16:8 Standard',
    };

    onLogCompletedFast(newLog);

    onUpdateState({
      isFasting: false,
      startTime: null,
      eatingWindowStartTime: endTime,
      targetHours: fastingState.targetHours || 16,
      protocolName: fastingState.protocolName || '16:8 Standard',
    });
  };

  // Adjust Start Time
  const handleSaveAdjustedTime = (timestamp: number) => {
    if (isFastingActive) {
      onUpdateState({
        ...fastingState,
        isFasting: true,
        startTime: timestamp,
      });
    } else {
      onUpdateState({
        ...fastingState,
        isFasting: false,
        eatingWindowStartTime: timestamp,
      });
    }
    setIsAdjustTimeOpen(false);
  };

  const handleSaveCustomTimeInput = () => {
    if (!customTimeInput) return;
    const [h, m] = customTimeInput.split(':').map(Number);
    const d = new Date(selectedDate + 'T00:00:00');
    d.setHours(h, m, 0, 0);
    handleSaveAdjustedTime(d.getTime());
  };

  return (
    <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-6 text-[#2F362F] card-shadow space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white shadow-sm">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
              Intermittent Fasting
            </span>
            <h2 className="text-lg font-bold font-serif-title text-[#1A1A1A]">
              Daily Non-Eating Tracker
            </h2>
          </div>
        </div>

        {isFastingActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Moon className="w-3.5 h-3.5 text-amber-600" />
            Fasting Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Sun className="w-3.5 h-3.5 text-emerald-600" />
            Eating Window Active
          </span>
        )}
      </div>

      {/* Main Fasting / Eating Window Display */}
      {isFastingActive ? (
        <div className="bg-[#F5F5F0] border border-[#5A5A40]/10 rounded-2xl p-5 space-y-4">
          
          {/* Protocol Tag & Start Time */}
          <div className="flex items-center justify-between text-xs text-[#5A5A40] font-medium">
            <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
              <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>{fastingState.protocolName || '16:8 Standard'}</span>
            </div>
            <span>
              Fast Started: <strong className="text-[#1A1A1A]">{formatDateLabel(effectiveFastingStartTime)} {formatTimeHHMM(effectiveFastingStartTime)}</strong>
            </span>
          </div>

          {/* Big Live Clock Display */}
          <div className="text-center py-2">
            <div className="text-4xl sm:text-5xl font-bold font-serif-title text-[#1A1A1A] tracking-tight">
              {String(fastHours).padStart(2, '0')}:{String(fastMinutes).padStart(2, '0')}:
              <span className="text-2xl sm:text-3xl font-mono text-[#5A5A40]">{String(fastSeconds).padStart(2, '0')}</span>
            </div>
            <p className="text-xs font-medium text-[#5A5A40]/80 mt-1">
              Goal: {fastingState.targetHours || 16} Hours Non-Eating Fast
            </p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A] mb-1.5">
              <span>{fastProgressPercent}% Fasting Completed</span>
              <span className="text-[#5A5A40]">
                Ends: {formatDateLabel(targetEndTimestamp)} {formatTimeHHMM(targetEndTimestamp)}
              </span>
            </div>
            <div className="w-full bg-[#E6E6DF] rounded-full h-3 overflow-hidden p-0.5 border border-[#5A5A40]/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fastProgressPercent >= 100
                    ? 'bg-emerald-500 shadow-sm'
                    : 'bg-[#5A5A40]'
                }`}
                style={{ width: `${fastProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Current Metabolic Phase Card */}
          <div className={`p-3 rounded-xl border text-xs ${currentStage.color}`}>
            <div className="font-bold flex items-center justify-between">
              <span>Phase: {currentStage.title}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">
                {fastHours >= 12 ? 'Ketosis On' : 'Standard Fast'}
              </span>
            </div>
            <p className="text-[11px] mt-0.5 opacity-90">{currentStage.desc}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsAdjustTimeOpen(!isAdjustTimeOpen)}
              className="text-xs font-medium text-[#5A5A40] hover:text-[#1A1A1A] flex items-center gap-1 py-1.5 px-2.5 rounded-xl hover:bg-[#E6E6DF]/60 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Adjust Fast Start Time</span>
            </button>

            <button
              type="button"
              onClick={() => handleEndFast()}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Break Fast & Eat</span>
            </button>
          </div>

          {/* Adjust Fast Start Time Drawer */}
          {isAdjustTimeOpen && (
            <div className="p-3.5 bg-white border border-[#5A5A40]/20 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-[#1A1A1A]">
                Set exact time fast started (Last Meal time):
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={customTimeInput}
                  onChange={(e) => setCustomTimeInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#5A5A40]/30 bg-[#F5F5F0] text-sm font-bold font-mono focus:outline-none focus:border-[#5A5A40]"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomTimeInput}
                  className="px-4 py-1.5 rounded-xl bg-[#5A5A40] text-white font-bold hover:opacity-90 transition-opacity"
                >
                  Save Time
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Eating Window Active State */
        <div className="bg-[#F5F5F0] border border-[#5A5A40]/10 rounded-2xl p-5 space-y-4">
          
          <div className="flex items-center justify-between text-xs text-[#5A5A40] font-medium">
            <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
              <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>{fastingState.protocolName || '16:8 Standard'}</span>
            </div>
            {effectiveEatingWindowStartTime && (
              <span className="text-[#1A1A1A]">
                First Meal: <strong className="text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md font-bold">🌅 {formatTimeHHMM(effectiveEatingWindowStartTime)}</strong>
              </span>
            )}
          </div>

          {/* Big Live Clock Display for Eating Window */}
          <div className="text-center py-2">
            <div className="text-4xl sm:text-5xl font-bold font-serif-title text-[#1A1A1A] tracking-tight">
              {String(ewHours).padStart(2, '0')}:{String(ewMinutes).padStart(2, '0')}:
              <span className="text-2xl sm:text-3xl font-mono text-[#5A5A40]">{String(ewSeconds).padStart(2, '0')}</span>
            </div>
            <p className="text-xs font-medium text-[#5A5A40]/80 mt-1">
              Eating Window Elapsed • Target {eatingWindowTargetHours} Hours (Window: {formatTimeHHMM(effectiveEatingWindowStartTime)} – {formatTimeHHMM(eatingWindowEndTime)})
            </p>
          </div>

          {/* Progress Bar for Eating Window */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A] mb-1.5">
              <span>{ewProgressPercent}% Eating Window Elapsed</span>
              <span className="text-[#5A5A40]">
                Next Fast Begins: {formatTimeHHMM(eatingWindowEndTime)}
              </span>
            </div>
            <div className="w-full bg-[#E6E6DF] rounded-full h-3 overflow-hidden p-0.5 border border-[#5A5A40]/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  ewProgressPercent >= 100
                    ? 'bg-amber-500 shadow-sm'
                    : 'bg-[#A3B18A]'
                }`}
                style={{ width: `${ewProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Prompt banner if eating window target reached */}
          {ewProgressPercent >= 100 && (
            <div className="p-3 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center justify-between">
              <span>⏰ 8h Eating window complete! Ready to start your fast?</span>
              <button
                type="button"
                onClick={() => handleStartFast()}
                className="px-3 py-1 rounded-lg bg-amber-900 text-white text-xs font-bold hover:bg-amber-950 transition-colors"
              >
                Start Fasting
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsAdjustTimeOpen(!isAdjustTimeOpen)}
              className="text-xs font-medium text-[#5A5A40] hover:text-[#1A1A1A] flex items-center gap-1 py-1.5 px-2.5 rounded-xl hover:bg-[#E6E6DF]/60 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Adjust First Meal Time</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartFast()}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A30] text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span>Start Fast (Last Meal)</span>
            </button>
          </div>

          {/* Adjust First Meal Time Drawer */}
          {isAdjustTimeOpen && (
            <div className="p-3.5 bg-white border border-[#5A5A40]/20 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-[#1A1A1A]">
                Adjust First Meal Time (Eating Window Start):
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={customTimeInput}
                  onChange={(e) => setCustomTimeInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#5A5A40]/30 bg-[#F5F5F0] text-sm font-bold font-mono focus:outline-none focus:border-[#5A5A40]"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomTimeInput}
                  className="px-4 py-1.5 rounded-xl bg-[#5A5A40] text-white font-bold hover:opacity-90 transition-opacity"
                >
                  Save Time
                </button>
              </div>
              {firstMealOfDate && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveAdjustedTime(firstMealOfDate.timestamp)}
                    className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <span>Use Today's First Meal ({formatTimeHHMM(firstMealOfDate.timestamp)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fasting Protocol Switcher */}
          <div className="pt-2 border-t border-[#5A5A40]/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-2">
              Fasting Target Protocol
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              {FASTING_PROTOCOLS.map((protocol) => (
                <button
                  key={protocol.name}
                  type="button"
                  onClick={() => handleStartFast(protocol)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    (fastingState.protocolName || '16:8 Standard') === protocol.name
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                      : 'bg-white hover:bg-[#F5F5F0] text-[#1A1A1A] border-[#5A5A40]/15'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>{protocol.name}</span>
                    <Play className="w-3 h-3 text-[#D4A373]" />
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {protocol.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Completed Fasting Logs History Summary */}
      {fastingLogs.length > 0 && (
        <div className="pt-2 border-t border-[#5A5A40]/10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block">
            Recent Completed Fasting Logs
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {fastingLogs.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs bg-[#F5F5F0] p-2.5 rounded-xl border border-[#5A5A40]/10"
              >
                <div>
                  <span className="font-bold text-[#1A1A1A]">{log.protocolName}</span>
                  <span className="text-[10px] text-[#5A5A40]/70 block">{log.date} ({formatTimeHHMM(log.startTime)} – {formatTimeHHMM(log.endTime)})</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold font-serif-title text-[#5A5A40]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{log.durationHours} hrs fast</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
