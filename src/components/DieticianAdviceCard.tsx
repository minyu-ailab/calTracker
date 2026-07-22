import React, { useState, useEffect } from 'react';
import { MealEntry, DailyGoals, DaySummaryFeedback } from '../types';
import { Sparkles, CheckCircle2, Lightbulb, AlertTriangle, ArrowRight, RefreshCw, Award } from 'lucide-react';

interface DieticianAdviceCardProps {
  meals: MealEntry[];
  goals: DailyGoals;
  selectedDate: string;
}

export const DieticianAdviceCard: React.FC<DieticianAdviceCardProps> = ({
  meals,
  goals,
  selectedDate,
}) => {
  const [feedback, setFeedback] = useState<DaySummaryFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDayFeedback = async () => {
    if (meals.length === 0) {
      setFeedback(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/day-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meals,
          goals,
          date: selectedDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize day feedback.');
      }

      setFeedback(data);
    } catch (err: any) {
      console.error('Day synthesis error', err);
      setError(err.message || 'Error generating dietician synthesis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDayFeedback();
  }, [meals.length, selectedDate]);

  if (meals.length === 0) {
    return (
      <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-8 text-center text-[#5A5A40] card-shadow">
        <Sparkles className="w-8 h-8 text-[#A3B18A] mx-auto mb-2 opacity-80" />
        <h3 className="text-base font-bold font-serif-title text-[#1A1A1A]">No Meals Logged For Selected Date</h3>
        <p className="text-xs text-[#5A5A40]/70 mt-1 max-w-md mx-auto">
          Log your first meal using a photo or text description to receive instant dietician macro analysis and personalized recommendations.
        </p>
      </div>
    );
  }

  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case 'Optimal':
        return 'bg-[#A3B18A]/30 text-[#5A5A40] border-[#A3B18A]/50';
      case 'Good Progress':
        return 'bg-[#E9EDC9] text-[#5A5A40] border-[#A3B18A]/30';
      case 'Needs Adjustment':
        return 'bg-[#D4A373]/25 text-[#5A5A40] border-[#D4A373]/40';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="bg-white border border-[#5A5A40]/15 rounded-[32px] p-6 text-[#2F362F] card-shadow">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#5A5A40]/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white font-bold shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
              Dietician Synthesis
            </span>
            <h2 className="text-lg font-bold font-serif-title text-[#1A1A1A]">
              Daily Path Analysis
            </h2>
          </div>
        </div>

        <button
          onClick={fetchDayFeedback}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-[#F5F5F0] hover:bg-[#E6E6DF] text-[#5A5A40] transition-colors border border-[#5A5A40]/15 disabled:opacity-50"
          title="Refresh Analysis"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#5A5A40]' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-[#5A5A40] space-y-3">
          <RefreshCw className="w-8 h-8 text-[#5A5A40] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2F362F]">
            Synthesizing daily intake with Gemini Clinical Dietician AI...
          </p>
        </div>
      ) : error ? (
        <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
          <button
            onClick={fetchDayFeedback}
            className="ml-auto underline font-semibold text-rose-900"
          >
            Retry
          </button>
        </div>
      ) : feedback ? (
        <div className="mt-4 space-y-4 text-xs">
          
          {/* Status Badge & Headline */}
          <div className="p-4 rounded-2xl bg-[#A3B18A]/10 border border-[#A3B18A]/20">
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getRatingBadgeClass(feedback.overallRating)} mb-2`}>
              {feedback.overallRating}
            </span>
            <h3 className="text-base font-bold font-serif-title italic text-[#1A1A1A]">
              "{feedback.headline}"
            </h3>
          </div>

          {/* Calorie & Macro Breakdown Paragraphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#5A5A40]/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-1">
                Calorie Intake
              </span>
              <p className="text-[#2F362F] leading-relaxed">
                {feedback.calorieComparison}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#5A5A40]/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-1">
                Macronutrient Balance
              </span>
              <p className="text-[#2F362F] leading-relaxed">
                {feedback.macroBalanceFeedback}
              </p>
            </div>
          </div>

          {/* Actionable Tips */}
          {feedback.actionableTips && feedback.actionableTips.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#E9EDC9] border border-[#A3B18A]/30">
              <div className="font-bold text-[#5A5A40] flex items-center gap-1.5 mb-2.5 text-xs font-serif-title">
                <Lightbulb className="w-4 h-4 text-[#5A5A40]" />
                <span>Expert Recommendations</span>
              </div>
              <ul className="space-y-2 text-[#2F362F]">
                {feedback.actionableTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Meal Suggestion */}
          {feedback.recommendedNextSteps && (
            <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#5A5A40]/15 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#5A5A40] text-white shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]">
                  Next Meal Focus
                </span>
                <p className="text-[#1A1A1A] text-xs mt-0.5 font-medium leading-relaxed font-serif-title italic">
                  {feedback.recommendedNextSteps}
                </p>
              </div>
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
};
