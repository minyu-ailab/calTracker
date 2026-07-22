import React, { useState } from 'react';
import { MealEntry } from '../types';
import { Sparkles, Trash2, ChevronDown, ChevronUp, Clock, ShieldAlert, CheckCircle2, Tag, Edit3 } from 'lucide-react';

interface MealCardProps {
  meal: MealEntry;
  onDeleteMeal: (id: string) => void;
  onEditMeal?: (meal: MealEntry) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onDeleteMeal, onEditMeal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  const getMealTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('1') || t.includes('breakfast')) {
      return 'bg-[#E9EDC9] text-[#5A5A40] border-[#A3B18A]/30';
    }
    if (t.includes('2') || t.includes('lunch')) {
      return 'bg-[#A3B18A]/25 text-[#5A5A40] border-[#A3B18A]/40';
    }
    if (t.includes('3') || t.includes('dinner')) {
      return 'bg-[#D4A373]/20 text-[#5A5A40] border-[#D4A373]/40';
    }
    return 'bg-[#5A5A40] text-white border-[#5A5A40]';
  };

  const formattedTime = new Date(meal.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white border border-[#5A5A40]/15 rounded-[28px] overflow-hidden card-shadow transition-all hover:border-[#5A5A40]/30 text-[#2F362F]">
      
      <div className="p-5 sm:p-6">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-start gap-4">
            {meal.imageUrl && (
              <img
                src={meal.imageUrl}
                alt={meal.mealName}
                onClick={() => setShowImageLightbox(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-[#5A5A40]/15 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              />
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getMealTypeBadge(meal.mealType)}`}>
                  {meal.mealType}
                </span>
                <span className="text-xs text-[#5A5A40]/70 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#5A5A40]" /> {formattedTime}
                </span>

                {meal.isFirstMealOfDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/50 flex items-center gap-1">
                    <span>🌅</span>
                    <span>First Meal (Broke Fast)</span>
                  </span>
                )}

                {meal.isLastMealOfDay && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300/50 flex items-center gap-1">
                    <span>🌙</span>
                    <span>Last Meal (Started Fast)</span>
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold font-serif-title text-[#1A1A1A] mt-1 leading-tight">
                {meal.mealName}
              </h3>

              {meal.description && (
                <p className="text-xs text-[#2F362F]/70 line-clamp-1 mt-1 font-serif-title italic">
                  "{meal.description}"
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
            {onEditMeal && (
              <button
                onClick={() => onEditMeal(meal)}
                className="p-2 rounded-xl text-[#5A5A40]/70 hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Edit Meal Entry"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={() => onDeleteMeal(meal.id)}
              className="p-2 rounded-xl text-[#5A5A40]/50 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Macro Summary Row */}
        <div className="mt-4 pt-3 border-t border-[#5A5A40]/10 grid grid-cols-5 gap-2 text-center text-xs">
          
          <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
            <div className="text-[10px] text-[#5A5A40]/60 uppercase font-bold tracking-tight">Calories</div>
            <div className="font-bold font-serif-title text-[#1A1A1A] text-sm sm:text-base mt-0.5">{Math.round(meal.totalCalories)}</div>
          </div>

          <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
            <div className="text-[10px] text-[#5A5A40] uppercase font-bold tracking-tight">Protein</div>
            <div className="font-bold font-serif-title text-[#5A5A40] text-sm sm:text-base mt-0.5">{Math.round(meal.totalProteinGrams)}g</div>
          </div>

          <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
            <div className="text-[10px] text-[#D4A373] uppercase font-bold tracking-tight">Carbs</div>
            <div className="font-bold font-serif-title text-[#D4A373] text-sm sm:text-base mt-0.5">{Math.round(meal.totalCarbsGrams)}g</div>
          </div>

          <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
            <div className="text-[10px] text-[#5A5A40] uppercase font-bold tracking-tight">Fat</div>
            <div className="font-bold font-serif-title text-[#5A5A40] text-sm sm:text-base mt-0.5">{Math.round(meal.totalFatGrams)}g</div>
          </div>

          <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
            <div className="text-[10px] text-[#A3B18A] uppercase font-bold tracking-tight">Fiber</div>
            <div className="font-bold font-serif-title text-[#A3B18A] text-sm sm:text-base mt-0.5">{Math.round(meal.totalFiberGrams || 0)}g</div>
          </div>

        </div>

        {/* Dietician Feedback Box */}
        {meal.dieticianFeedback && (
          <div className="mt-4 p-4 rounded-2xl bg-[#A3B18A]/10 border border-[#A3B18A]/25 text-xs text-[#2F362F] relative">
            <div className="flex items-center gap-1.5 font-bold text-[#5A5A40] uppercase tracking-wider text-[10px] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Expert Feedback</span>
            </div>
            <p className="font-serif-title italic text-sm text-[#2F362F] leading-relaxed">
              "{meal.dieticianFeedback}"
            </p>

            {/* Micronutrient tags */}
            {meal.micronutrientHighlights && meal.micronutrientHighlights.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-[#A3B18A]/20">
                {meal.micronutrientHighlights.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#A3B18A]/20 text-[#5A5A40] border border-[#A3B18A]/30"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#5A5A40]" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expand/Collapse Component Breakdown */}
        {meal.foodItems && meal.foodItems.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-xs text-[#5A5A40] font-semibold hover:opacity-80 py-1 transition-opacity"
            >
              <span>
                {isExpanded ? 'Hide' : 'Show'} detailed food items ({meal.foodItems.length})
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-2 pt-2 border-t border-[#5A5A40]/10">
                {meal.foodItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F5F5F0] p-3 rounded-2xl border border-[#5A5A40]/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                  >
                    <div>
                      <span className="font-semibold text-[#1A1A1A]">{item.item}</span>
                      <span className="text-[#5A5A40]/70 text-[11px] ml-2">({item.portion})</span>
                    </div>

                    <div className="flex items-center gap-3 text-[#2F362F] font-mono text-[11px]">
                      <span>{Math.round(item.calories)} kcal</span>
                      <span className="text-[#5A5A40] font-bold">{Math.round(item.proteinGrams)}g P</span>
                      <span className="text-[#D4A373] font-bold">{Math.round(item.carbsGrams)}g C</span>
                      <span className="text-[#5A5A40] font-bold">{Math.round(item.fatGrams)}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox Modal for Photo */}
      {showImageLightbox && meal.imageUrl && (
        <div
          onClick={() => setShowImageLightbox(false)}
          className="fixed inset-0 z-50 bg-[#1A1A1A]/80 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white p-3 card-shadow">
            <img
              src={meal.imageUrl}
              alt={meal.mealName}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <p className="text-center text-xs text-[#5A5A40] mt-2 font-medium">
              Click anywhere to close
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
