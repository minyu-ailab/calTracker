import React, { useState } from 'react';
import { DailyGoals } from '../types';
import { Target, FileText, Sparkles, X, Check, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DailyGoals;
  onSaveGoals: (newGoals: DailyGoals) => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  goals,
  onSaveGoals,
}) => {
  const [documentText, setDocumentText] = useState(goals.customDocumentText || '');
  const [dailyCalories, setDailyCalories] = useState(goals.dailyCalories);
  const [dailyProteinGrams, setDailyProteinGrams] = useState(goals.dailyProteinGrams);
  const [dailyCarbsGrams, setDailyCarbsGrams] = useState(goals.dailyCarbsGrams);
  const [dailyFatGrams, setDailyFatGrams] = useState(goals.dailyFatGrams);
  const [dailyFiberGrams, setDailyFiberGrams] = useState(goals.dailyFiberGrams);
  const [waterMlGoal, setWaterMlGoal] = useState(goals.waterMlGoal);
  const [goalNotes, setGoalNotes] = useState(goals.goalNotes || '');

  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseDocument = async () => {
    if (!documentText.trim()) {
      setParseError('Please paste or type your dietician plan or target document text first.');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseSuccessMsg(null);

    try {
      const res = await fetch('/api/parse-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: documentText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse goals.');
      }

      if (data.dailyCalories) setDailyCalories(data.dailyCalories);
      if (data.dailyProteinGrams) setDailyProteinGrams(data.dailyProteinGrams);
      if (data.dailyCarbsGrams) setDailyCarbsGrams(data.dailyCarbsGrams);
      if (data.dailyFatGrams) setDailyFatGrams(data.dailyFatGrams);
      if (data.dailyFiberGrams) setDailyFiberGrams(data.dailyFiberGrams);
      if (data.waterMlGoal) setWaterMlGoal(data.waterMlGoal);
      if (data.goalNotes) setGoalNotes(data.goalNotes);

      setParseSuccessMsg('Targets successfully extracted from document!');
    } catch (err: any) {
      console.error('Failed to parse goal document', err);
      setParseError(err.message || 'AI parsing error.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = () => {
    const updatedGoals: DailyGoals = {
      dailyCalories: Number(dailyCalories) || 2000,
      dailyProteinGrams: Number(dailyProteinGrams) || 150,
      dailyCarbsGrams: Number(dailyCarbsGrams) || 200,
      dailyFatGrams: Number(dailyFatGrams) || 65,
      dailyFiberGrams: Number(dailyFiberGrams) || 30,
      waterMlGoal: Number(waterMlGoal) || 2500,
      customDocumentText: documentText,
      goalNotes,
    };

    onSaveGoals(updatedGoals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#5A5A40]/20 rounded-[32px] max-w-2xl w-full p-6 text-[#2F362F] card-shadow relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#5A5A40]/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
                Target Setup
              </span>
              <h2 className="text-lg font-bold font-serif-title text-[#1A1A1A]">Daily Goals & Intake Document</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5A5A40]/60 hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          
          {/* Document Paste / View Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#5A5A40] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#5A5A40]" />
                <span>Attached Goals Document / Text</span>
              </label>
              
              <button
                type="button"
                onClick={handleParseDocument}
                disabled={isParsing}
                className="text-xs font-bold text-[#5A5A40] hover:text-[#1A1A1A] bg-[#A3B18A]/20 hover:bg-[#A3B18A]/30 px-3 py-1.5 rounded-xl border border-[#A3B18A]/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5A5A40]" /> Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" /> Auto-Parse with Gemini
                  </>
                )}
              </button>
            </div>

            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your dietician sheet, meal plan guidelines, or goal document here..."
              rows={4}
              className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3.5 text-xs font-mono text-[#1A1A1A] placeholder-[#5A5A40]/50 focus:outline-none focus:border-[#5A5A40]"
            />

            {parseError && (
              <div className="mt-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}

            {parseSuccessMsg && (
              <div className="mt-2 p-3 rounded-2xl bg-[#E9EDC9] border border-[#A3B18A]/30 text-[#5A5A40] text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0 text-[#5A5A40]" />
                <span>{parseSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Numerical Macro Targets */}
          <div className="pt-3 border-t border-[#5A5A40]/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-3 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#D4A373]" />
              <span>Target Numerical Values</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A5A40] mb-1">
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  value={dailyCalories}
                  onChange={(e) => setDailyCalories(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-2.5 text-sm font-bold font-serif-title text-[#1A1A1A] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5A40] mb-1">
                  Protein Goal (grams)
                </label>
                <input
                  type="number"
                  value={dailyProteinGrams}
                  onChange={(e) => setDailyProteinGrams(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-2.5 text-sm font-bold font-serif-title text-[#5A5A40] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#D4A373] mb-1">
                  Carbs Goal (grams)
                </label>
                <input
                  type="number"
                  value={dailyCarbsGrams}
                  onChange={(e) => setDailyCarbsGrams(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-2.5 text-sm font-bold font-serif-title text-[#D4A373] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5A40] mb-1">
                  Fat Goal (grams)
                </label>
                <input
                  type="number"
                  value={dailyFatGrams}
                  onChange={(e) => setDailyFatGrams(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-2.5 text-sm font-bold font-serif-title text-[#5A5A40] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A3B18A] mb-1">
                  Fiber Goal (grams)
                </label>
                <input
                  type="number"
                  value={dailyFiberGrams}
                  onChange={(e) => setDailyFiberGrams(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-2.5 text-sm font-bold font-serif-title text-[#A3B18A] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5A40] mb-1">
                  Water Goal (ml)
                </label>
                <input
                  type="number"
                  step="250"
                  value={waterMlGoal}
                  onChange={(e) => setWaterMlGoal(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-2.5 text-sm font-bold font-serif-title text-[#5A5A40] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>
            </div>
          </div>

          {/* Goal Strategy Summary Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-1.5">
              Specific Diet Focus & Notes
            </label>
            <input
              type="text"
              value={goalNotes}
              onChange={(e) => setGoalNotes(e.target.value)}
              placeholder="e.g. Muscle hypertrophy, fat loss, low sodium, keto, anti-inflammatory..."
              className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3 text-xs text-[#1A1A1A] placeholder-[#5A5A40]/50 focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#5A5A40]/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#5A5A40] hover:bg-[#F5F5F0]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-2xl text-xs font-medium bg-[#5A5A40] text-white hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Goals
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
