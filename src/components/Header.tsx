import React from 'react';
import { Utensils, Calendar, Target, Plus, ChevronLeft, ChevronRight, FileText, Sparkles, Smartphone } from 'lucide-react';
import { getTodayDateString } from '../lib/storage';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  onOpenMealLogger: () => void;
  onOpenGoalsModal: () => void;
  onOpenSynthesis: () => void;
  onOpenAppleHealthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  onOpenMealLogger,
  onOpenGoalsModal,
  onOpenSynthesis,
  onOpenAppleHealthModal,
}) => {
  const today = getTodayDateString();
  const isToday = selectedDate === today;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === today) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <header className="bg-[#FFFFFF] border-b border-[#5A5A40]/15 text-[#2F362F] sticky top-0 z-30 card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#5A5A40] flex items-center justify-center text-white shadow-sm font-serif-title font-bold text-lg">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#5A5A40] block">
              Nutrition & Longevity
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif-title text-[#1A1A1A] tracking-tight">
                Daily Path
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E9EDC9] text-[#5A5A40] border border-[#A3B18A]/30">
                <Sparkles className="w-3 h-3 text-[#5A5A40]" /> Gemini 3.6
              </span>
            </div>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between sm:justify-center gap-2 bg-[#F5F5F0] p-1.5 rounded-2xl border border-[#5A5A40]/15">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl text-[#5A5A40] hover:bg-[#5A5A40]/10 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 text-xs font-semibold text-[#2F362F]">
            <Calendar className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span>{formatDateDisplay(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="bg-transparent text-[#2F362F] hover:opacity-80 cursor-pointer w-4 h-4 opacity-0 absolute z-10"
              title="Pick Date"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl text-[#5A5A40] hover:bg-[#5A5A40]/10 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => onDateChange(today)}
              className="ml-1 text-[11px] px-2.5 py-1 rounded-xl bg-[#5A5A40] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Today
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={onOpenAppleHealthModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A] bg-[#F5F5F0] hover:bg-[#E6E6DF] px-3.5 py-2 rounded-2xl border border-[#5A5A40]/20 transition-all whitespace-nowrap shadow-2xs"
            title="Connect iPhone Apple Health / Apple Watch"
          >
            <Smartphone className="w-4 h-4 text-[#1A1A1A]" />
            <span>Apple Health</span>
          </button>

          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5A5A40] border-2 border-[#5A5A40] hover:bg-[#5A5A40]/5 px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-[#5A5A40]" />
            <span>Goals Plan</span>
          </button>

          <button
            onClick={onOpenSynthesis}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5A5A40] bg-[#E9EDC9] hover:bg-[#A3B18A]/30 px-3.5 py-2 rounded-2xl border border-[#A3B18A]/40 transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-[#5A5A40]" />
            <span>Dietician Report</span>
          </button>

          <button
            onClick={onOpenMealLogger}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#5A5A40] hover:opacity-90 px-4 py-2 rounded-2xl shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal</span>
          </button>
        </div>

      </div>
    </header>
  );
};
