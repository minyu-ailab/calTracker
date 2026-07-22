import React, { useState, useRef, useEffect } from 'react';
import { MealEntry, DailyGoals, FoodItem } from '../types';
import { Camera, Upload, Sparkles, X, Check, RefreshCw, AlertCircle, Clock, Lightbulb } from 'lucide-react';

interface MealLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealEntry) => void;
  selectedDate: string;
  goals: DailyGoals;
  existingMealsCount?: number;
  editingMeal?: MealEntry | null;
}

const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const MealLogger: React.FC<MealLoggerProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  selectedDate,
  goals,
  existingMealsCount = 0,
  editingMeal = null,
}) => {
  const [mealLabel, setMealLabel] = useState<string>(`Meal ${existingMealsCount + 1}`);
  const [mealTime, setMealTime] = useState<string>(getCurrentTimeString());
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  // Intermittent Fasting Meal Flags
  const [isFirstMealOfDay, setIsFirstMealOfDay] = useState<boolean>(false);
  const [isLastMealOfDay, setIsLastMealOfDay] = useState<boolean>(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // AI Analyzed Result Preview
  const [analysisResult, setAnalysisResult] = useState<{
    mealName: string;
    foodItems: FoodItem[];
    totalCalories: number;
    totalProteinGrams: number;
    totalCarbsGrams: number;
    totalFatGrams: number;
    totalFiberGrams: number;
    dieticianFeedback: string;
    micronutrientHighlights: string[];
  } | null>(null);

  // Sync default meal title and time when opened or when editingMeal changes
  useEffect(() => {
    if (isOpen) {
      if (editingMeal) {
        setMealLabel(editingMeal.mealType || `Meal ${existingMealsCount + 1}`);
        const dateObj = new Date(editingMeal.timestamp);
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        setMealTime(`${hours}:${minutes}`);
        setDescription(editingMeal.description || '');
        setSelectedImage(editingMeal.imageUrl || null);
        setIsFirstMealOfDay(Boolean(editingMeal.isFirstMealOfDay));
        setIsLastMealOfDay(Boolean(editingMeal.isLastMealOfDay));

        setAnalysisResult({
          mealName: editingMeal.mealName,
          foodItems: editingMeal.foodItems || [],
          totalCalories: editingMeal.totalCalories,
          totalProteinGrams: editingMeal.totalProteinGrams,
          totalCarbsGrams: editingMeal.totalCarbsGrams,
          totalFatGrams: editingMeal.totalFatGrams,
          totalFiberGrams: editingMeal.totalFiberGrams || 0,
          dieticianFeedback: editingMeal.dieticianFeedback || 'Manually updated entry.',
          micronutrientHighlights: editingMeal.micronutrientHighlights || [],
        });
      } else {
        setMealLabel(`Meal ${existingMealsCount + 1}`);
        setMealTime(getCurrentTimeString());
        setDescription('');
        setSelectedImage(null);
        setIsFirstMealOfDay(false);
        setIsLastMealOfDay(false);
        setAnalysisResult(null);
      }
    }
  }, [isOpen, editingMeal, existingMealsCount]);

  if (!isOpen) return null;

  // Camera stream controls
  const startCamera = async () => {
    try {
      setAnalysisError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error', err);
      setAnalysisError('Could not open camera. Please ensure camera permissions are allowed or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      setImageMimeType('image/jpeg');
    }
    stopCamera();
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setImageMimeType(file.type);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  // AI Analysis Call
  const handleAnalyzeMeal = async () => {
    if (!description.trim() && !selectedImage) {
      setAnalysisError('Please provide either a photo or a text description of what you ate.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: description,
          imageBase64: selectedImage,
          mimeType: imageMimeType,
          mealType: mealLabel || `Meal ${existingMealsCount + 1}`,
          goals,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze meal.');
      }

      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Meal analysis failed', err);
      setAnalysisError(err.message || 'Error communicating with Gemini AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTimestampFromDateTime = (dateStr: string, timeStr: string) => {
    if (!timeStr) return Date.now();
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day, hours, minutes).getTime();
    }
    return Date.now();
  };

  // Save Final Entry
  const handleConfirmSave = () => {
    if (!analysisResult) return;

    const finalLabel = mealLabel.trim() || `Meal ${existingMealsCount + 1}`;

    const newMeal: MealEntry = {
      id: editingMeal ? editingMeal.id : 'meal-' + Date.now(),
      date: editingMeal ? editingMeal.date : selectedDate,
      timestamp: getTimestampFromDateTime(editingMeal ? editingMeal.date : selectedDate, mealTime),
      mealType: finalLabel,
      mealName: analysisResult.mealName,
      description: description || undefined,
      imageUrl: selectedImage || undefined,
      foodItems: analysisResult.foodItems,
      totalCalories: analysisResult.totalCalories,
      totalProteinGrams: analysisResult.totalProteinGrams,
      totalCarbsGrams: analysisResult.totalCarbsGrams,
      totalFatGrams: analysisResult.totalFatGrams,
      totalFiberGrams: analysisResult.totalFiberGrams,
      dieticianFeedback: analysisResult.dieticianFeedback,
      micronutrientHighlights: analysisResult.micronutrientHighlights,
      isFirstMealOfDay,
      isLastMealOfDay,
    };

    onSaveMeal(newMeal);
    resetAndClose();
  };

  const resetAndClose = () => {
    stopCamera();
    setSelectedImage(null);
    setDescription('');
    setAnalysisResult(null);
    setAnalysisError(null);
    onClose();
  };

  const sampleMealPresets = [
    '2 poached eggs with avocado on sourdough toast & black coffee',
    'Grilled salmon filet, 1 cup quinoa, steamed broccoli with olive oil',
    'Whey protein shake with 1 banana, 1 tbsp peanut butter & almond milk',
    'Chipotle chicken bowl with brown rice, black beans, fajita veggies & salsa',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#5A5A40]/20 rounded-[32px] max-w-2xl w-full p-6 text-[#2F362F] card-shadow relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#5A5A40]/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#5A5A40] text-white font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40] block">
                Food Entry
              </span>
              <h2 className="text-lg font-bold font-serif-title text-[#1A1A1A]">Log Meal & Analyze</h2>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-[#5A5A40]/60 hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!analysisResult ? (
          <div className="mt-5 space-y-5">
            
            {/* Meal Name & Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-1.5">
                  Meal Name / Label
                </label>
                <input
                  type="text"
                  value={mealLabel}
                  onChange={(e) => setMealLabel(e.target.value)}
                  placeholder="e.g. Meal 1, Meal 2, Pre-workout..."
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3 text-sm font-semibold text-[#1A1A1A] placeholder-[#5A5A40]/50 focus:outline-none focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>Meal Time</span>
                </label>
                <input
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#5A5A40]"
                />
              </div>
            </div>

            {/* Intermittent Fasting Option Boxes */}
            <div className="p-3.5 bg-[#F5F5F0] rounded-2xl border border-[#5A5A40]/15 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                Intermittent Fasting Schedule (Auto-Adjust)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isFirstMealOfDay;
                    setIsFirstMealOfDay(nextVal);
                    if (nextVal) setIsLastMealOfDay(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isFirstMealOfDay
                      ? 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-2xs'
                      : 'bg-white border-[#5A5A40]/20 hover:border-[#5A5A40]/40 text-[#2F362F]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isFirstMealOfDay}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#5A5A40] w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🌅</span> First meal of the day
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                      Ends current fast at {mealTime} & opens eating window
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isLastMealOfDay;
                    setIsLastMealOfDay(nextVal);
                    if (nextVal) setIsFirstMealOfDay(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isLastMealOfDay
                      ? 'bg-indigo-100/90 border-indigo-400 text-indigo-950 shadow-2xs'
                      : 'bg-white border-[#5A5A40]/20 hover:border-[#5A5A40]/40 text-[#2F362F]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isLastMealOfDay}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#5A5A40] w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🌙</span> Last meal of the day
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                      Starts fast timer at {mealTime} & closes eating window
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Photo Capture or Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">
                Meal Photo (Optional but Recommended)
              </label>

              {isCameraActive ? (
                <div className="relative bg-black rounded-2xl overflow-hidden border border-[#5A5A40]/20 aspect-video flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={captureCameraPhoto}
                      className="bg-[#5A5A40] text-white font-medium text-xs px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg"
                    >
                      <Camera className="w-4 h-4" /> Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-white/80 text-[#2F362F] text-xs px-3 py-2 rounded-2xl font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#5A5A40]/20 bg-[#F5F5F0] max-h-56 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Meal Preview"
                    className="max-h-56 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-rose-600 p-1.5 rounded-xl border border-rose-200 shadow-sm"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#5A5A40]/20 bg-[#F5F5F0] hover:bg-[#E6E6DF] transition-colors text-[#5A5A40] text-xs gap-2"
                  >
                    <Camera className="w-6 h-6 text-[#5A5A40]" />
                    <span className="font-semibold">Take Photo with Camera</span>
                  </button>

                  <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#5A5A40]/20 bg-[#F5F5F0] hover:bg-[#E6E6DF] cursor-pointer transition-colors text-[#5A5A40] text-xs gap-2">
                    <Upload className="w-6 h-6 text-[#5A5A40]" />
                    <span className="font-semibold">Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Description or Text Prompt */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">
                Text Description & Portions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your meal (e.g. 2 poached eggs with avocado on sourdough toast & black coffee)..."
                rows={3}
                className="w-full bg-[#F5F5F0] border border-[#5A5A40]/20 rounded-2xl p-3.5 text-sm text-[#1A1A1A] placeholder-[#5A5A40]/50 focus:outline-none focus:border-[#5A5A40]"
              />

              {/* Sample Presets */}
              <div className="mt-2.5">
                <span className="text-[11px] text-[#5A5A40] font-semibold block mb-1">
                  Quick Sample Ideas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleMealPresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDescription(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-[#F5F5F0] hover:bg-[#E6E6DF] text-[#5A5A40] border border-[#5A5A40]/15 transition-colors font-medium"
                    >
                      + {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message Display */}
            {analysisError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3 border-t border-[#5A5A40]/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#5A5A40] hover:bg-[#F5F5F0]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAnalyzeMeal}
                disabled={isAnalyzing}
                className="px-5 py-2.5 rounded-2xl text-xs font-medium bg-[#5A5A40] text-white hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Meal with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Estimate Calories & Macros</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          /* Analysis Review & Confirm Screen */
          <div className="mt-5 space-y-4">
            
            <div className="bg-[#A3B18A]/15 border border-[#A3B18A]/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 w-full sm:w-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-1">
                  {editingMeal ? 'Edit Meal Name & Calorie Totals' : 'AI Dietician Estimate Ready'}
                </span>
                <input
                  type="text"
                  value={analysisResult.mealName}
                  onChange={(e) =>
                    setAnalysisResult({
                      ...analysisResult,
                      mealName: e.target.value,
                    })
                  }
                  className="text-base font-bold font-serif-title text-[#1A1A1A] w-full bg-white px-3 py-1.5 rounded-xl border border-[#5A5A40]/20 focus:outline-none focus:border-[#5A5A40]"
                  placeholder="Meal Name"
                />
              </div>
              <div className="w-full sm:w-auto text-left sm:text-right">
                <label className="text-[10px] text-[#5A5A40] uppercase font-bold block mb-0.5">Calories (kcal)</label>
                <input
                  type="number"
                  value={analysisResult.totalCalories}
                  onChange={(e) =>
                    setAnalysisResult({
                      ...analysisResult,
                      totalCalories: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="text-xl font-bold font-serif-title text-[#1A1A1A] w-32 bg-white px-3 py-1 rounded-xl border border-[#5A5A40]/20 text-right focus:outline-none focus:border-[#5A5A40]"
                />
              </div>
            </div>

            {/* Editable Macro Cards Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-1.5">
                Adjust Macros (Grams)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
                  <div className="text-[10px] text-[#5A5A40] uppercase font-bold mb-1">Protein (g)</div>
                  <input
                    type="number"
                    value={analysisResult.totalProteinGrams}
                    onChange={(e) =>
                      setAnalysisResult({
                        ...analysisResult,
                        totalProteinGrams: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="font-bold font-serif-title text-[#1A1A1A] text-sm w-full bg-white px-2 py-1 rounded-lg border border-[#5A5A40]/20 text-center"
                  />
                </div>
                <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
                  <div className="text-[10px] text-[#D4A373] uppercase font-bold mb-1">Carbs (g)</div>
                  <input
                    type="number"
                    value={analysisResult.totalCarbsGrams}
                    onChange={(e) =>
                      setAnalysisResult({
                        ...analysisResult,
                        totalCarbsGrams: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="font-bold font-serif-title text-[#1A1A1A] text-sm w-full bg-white px-2 py-1 rounded-lg border border-[#5A5A40]/20 text-center"
                  />
                </div>
                <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
                  <div className="text-[10px] text-[#5A5A40] uppercase font-bold mb-1">Fat (g)</div>
                  <input
                    type="number"
                    value={analysisResult.totalFatGrams}
                    onChange={(e) =>
                      setAnalysisResult({
                        ...analysisResult,
                        totalFatGrams: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="font-bold font-serif-title text-[#1A1A1A] text-sm w-full bg-white px-2 py-1 rounded-lg border border-[#5A5A40]/20 text-center"
                  />
                </div>
                <div className="bg-[#F5F5F0] p-2.5 rounded-2xl border border-[#5A5A40]/10">
                  <div className="text-[10px] text-[#A3B18A] uppercase font-bold mb-1">Fiber (g)</div>
                  <input
                    type="number"
                    value={analysisResult.totalFiberGrams}
                    onChange={(e) =>
                      setAnalysisResult({
                        ...analysisResult,
                        totalFiberGrams: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="font-bold font-serif-title text-[#1A1A1A] text-sm w-full bg-white px-2 py-1 rounded-lg border border-[#5A5A40]/20 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Food Item Breakdown */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5A5A40] mb-2">
                Identified Food Components ({analysisResult.foodItems.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {analysisResult.foodItems.map((fi, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F5F5F0] p-3 rounded-2xl border border-[#5A5A40]/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#1A1A1A]">{fi.item}</span>
                      <span className="text-[#5A5A40]/70 text-[11px] ml-2">({fi.portion})</span>
                    </div>
                    <div className="font-mono text-[#2F362F] font-semibold text-[11px]">
                      {Math.round(fi.calories)} kcal | {Math.round(fi.proteinGrams)}g P
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dietician Feedback Preview */}
            <div className="p-4 rounded-2xl bg-[#A3B18A]/10 border border-[#A3B18A]/25 text-xs">
              <div className="font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1 font-serif-title">
                <Lightbulb className="w-4 h-4 text-[#5A5A40]" /> Expert Feedback
              </div>
              <p className="text-[#2F362F] font-serif-title italic leading-relaxed">
                "{analysisResult.dieticianFeedback}"
              </p>
            </div>

            {/* Intermittent Fasting Option Boxes Review */}
            <div className="p-3.5 bg-[#F5F5F0] rounded-2xl border border-[#5A5A40]/15 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                Intermittent Fasting Option
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isFirstMealOfDay;
                    setIsFirstMealOfDay(nextVal);
                    if (nextVal) setIsLastMealOfDay(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isFirstMealOfDay
                      ? 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-2xs'
                      : 'bg-white border-[#5A5A40]/20 hover:border-[#5A5A40]/40 text-[#2F362F]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isFirstMealOfDay}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#5A5A40] w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🌅</span> First meal of the day
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight">
                      Ends fast at {mealTime}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isLastMealOfDay;
                    setIsLastMealOfDay(nextVal);
                    if (nextVal) setIsFirstMealOfDay(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    isLastMealOfDay
                      ? 'bg-indigo-100/90 border-indigo-400 text-indigo-950 shadow-2xs'
                      : 'bg-white border-[#5A5A40]/20 hover:border-[#5A5A40]/40 text-[#2F362F]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isLastMealOfDay}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#5A5A40] w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🌙</span> Last meal of the day
                    </div>
                    <div className="text-[10px] opacity-80 leading-tight">
                      Starts fast at {mealTime}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="pt-3 border-t border-[#5A5A40]/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                className="text-xs text-[#5A5A40] font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-analyze / Edit
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 rounded-2xl text-xs font-medium text-[#5A5A40] hover:bg-[#F5F5F0]"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-5 py-2.5 rounded-2xl text-xs font-medium bg-[#5A5A40] text-white hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save to Daily Log
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
