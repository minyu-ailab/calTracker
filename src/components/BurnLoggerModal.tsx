import React, { useState } from 'react';
import { BurnEntry } from '../types';
import { Flame, X, Check, Plus, Trash2, Smartphone, RefreshCw } from 'lucide-react';

interface BurnLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBurn: (burn: BurnEntry) => void;
  selectedDate: string;
  todayBurnEntries: BurnEntry[];
  onDeleteBurn: (id: string) => void;
  onOpenAppleHealthModal?: () => void;
}

const BURN_PRESETS = [
  { name: 'Brisk Walk (30 min)', calories: 150 },
  { name: 'Running / Jogging (30 min)', calories: 300 },
  { name: 'Strength Training (45 min)', calories: 220 },
  { name: 'Cycling (30 min)', calories: 250 },
  { name: 'HIIT Workout (20 min)', calories: 200 },
  { name: 'Yoga / Stretching (30 min)', calories: 100 },
];

export const BurnLoggerModal: React.FC<BurnLoggerModalProps> = ({
  isOpen,
  onClose,
  onSaveBurn,
  selectedDate,
  todayBurnEntries,
  onDeleteBurn,
  onOpenAppleHealthModal,
}) => {
  const [activityName, setActivityName] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState<number>(250);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caloriesBurned <= 0) return;

    const newBurn: BurnEntry = {
      id: 'burn-' + Date.now(),
      date: selectedDate,
      activityName: activityName.trim() || 'Active Exercise',
      caloriesBurned: Number(caloriesBurned),
      timestamp: Date.now(),
    };

    onSaveBurn(newBurn);
    setActivityName('');
    setCaloriesBurned(250);
  };

  const handleApplyPreset = (preset: { name: string; calories: number }) => {
    setActivityName(preset.name);
    setCaloriesBurned(preset.calories);
  };

  const totalBurnToday = todayBurnEntries.reduce((sum, b) => sum + b.caloriesBurned, 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#5A5A40]/20 rounded-[32px] max-w-md w-full p-6 text-[#2F362F] card-shadow relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#5A5A40]/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4A373] text-white font-bold shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
                Activity Log
              </span>
              <h2 className="text-lg font-bold font-serif-title text-[#1A1A1A]">Log Calorie Burn</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5A5A40]/60 hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Apple Health Sync Banner */}
        {onOpenAppleHealthModal && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-amber-200 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-white">Apple Health Sync</span>
                <span className="text-[10px] text-white/70 block">Pull Active Calories from iPhone & Apple Watch</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAppleHealthModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-[#1A1A1A] font-bold text-xs hover:bg-amber-100 transition-colors shrink-0"
            >
              Connect
            </button>
          </div>
        )}

        {/* Existing Entries Summary for Selected Date */}
        {todayBurnEntries.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-[#F5F5F0] border border-[#5A5A40]/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
              <span>Logged Burn for {selectedDate}</span>
              <span className="text-[#D4A373] font-serif-title text-sm">{totalBurnToday} kcal</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {todayBurnEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-[#5A5A40]/10"
                >
                  <span className="font-medium text-[#1A1A1A]">{entry.activityName || 'Exercise'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-serif-title text-[#D4A373]">+{entry.caloriesBurned} kcal</span>
                    <button
                      onClick={() => onDeleteBurn(entry.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Burn Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-1.5">
              Activity Name (Optional)
            </label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g. Evening Run, Cycling, Gym Session..."
              className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3 text-sm text-[#1A1A1A] placeholder-[#5A5A40]/50 focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-1.5">
              Calories Burned (kcal)
            </label>
            <input
              type="number"
              min="1"
              max="5000"
              value={caloriesBurned || ''}
              onChange={(e) => setCaloriesBurned(Number(e.target.value))}
              placeholder="e.g. 350"
              required
              className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3 text-base font-bold font-serif-title text-[#1A1A1A] focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] text-[#5A5A40] font-semibold block mb-1.5">
              Quick Activity Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BURN_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-[#F5F5F0] hover:bg-[#E6E6DF] text-[#5A5A40] border border-[#5A5A40]/15 transition-colors font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-[#D4A373]" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#5A5A40]/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#5A5A40] hover:bg-[#F5F5F0]"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl text-xs font-medium bg-[#5A5A40] text-white hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Calorie Burn
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
