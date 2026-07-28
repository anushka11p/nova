import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Eye, Info } from 'lucide-react';

export const GradCamVisualizer = ({ riskLevel = "High Risk", confidence = 94.8 }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // Define skin tones based on risk level
  const getSkinTone = () => {
    switch (riskLevel) {
      case "High Risk":
        return "#e0ab44"; // Deep yellow/amber jaundice tone
      case "Moderate Risk":
        return "#f1d48c"; // Mild yellowish tone
      case "Normal":
      default:
        return "#fcdcd2"; // Healthy pinkish/peachy tone
    }
  };

  const skinColor = getSkinTone();

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Shared Baby Face SVG component
  const BabyFaceSVG = ({ showHeatmap = false }) => {
    return (
      <svg 
        viewBox="0 0 400 300" 
        className="w-full h-full object-cover select-none bg-slate-900"
      >
        <defs>
          {/* Heatmap Gradients */}
          <radialGradient id="heatmapHigh" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#f97316" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.65" />
            <stop offset="75%" stopColor="#22c55e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </radialGradient>

          <radialGradient id="heatmapMid" cx="48%" cy="45%" r="40%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.80" />
            <stop offset="35%" stopColor="#eab308" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#22c55e" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </radialGradient>

          <radialGradient id="heatmapLow" cx="50%" cy="50%" r="20%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </radialGradient>

          {/* Shading for depth */}
          <linearGradient id="blanketGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.15" />
          </filter>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Background */}
        <rect width="400" height="300" fill="#0f172a" />

        {/* Baby Blanket Wrap Background */}
        <path d="M 50 300 Q 200 120 350 300 Z" fill="url(#blanketGrad)" />

        {/* Main Baby Head */}
        <g filter="url(#shadow)">
          <circle cx="200" cy="140" r="65" fill={skinColor} />
          
          {/* Baby Cap */}
          <path d="M 135 140 A 65 65 0 0 1 265 140 Q 200 115 135 140" fill="#e0f2fe" />
          <path d="M 130 140 Q 200 135 270 140 L 265 145 Q 200 140 135 145 Z" fill="#bae6fd" />
          {/* Cap pompom or fold */}
          <circle cx="200" cy="74" r="8" fill="#e0f2fe" />
        </g>

        {/* Face Elements */}
        {/* Closed Sleeping Eyes */}
        <path d="M 160 145 Q 172 153 182 145" fill="none" stroke="#5c4d3c" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 218 145 Q 228 153 240 145" fill="none" stroke="#5c4d3c" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Cute Eyebrows */}
        <path d="M 156 138 Q 170 132 182 137" fill="none" stroke="#8a735c" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        <path d="M 218 137 Q 230 132 244 138" fill="none" stroke="#8a735c" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />

        {/* Rosy Cheeks */}
        <circle cx="152" cy="158" r="10" fill="#f43f5e" opacity={riskLevel === "Normal" ? 0.25 : 0.15} />
        <circle cx="248" cy="158" r="10" fill="#f43f5e" opacity={riskLevel === "Normal" ? 0.25 : 0.15} />

        {/* Cute Baby Nose */}
        <path d="M 197 158 Q 200 162 203 158" fill="none" stroke="#5c4d3c" strokeWidth="2" strokeLinecap="round" />

        {/* Sleeping Baby Mouth */}
        <path d="M 192 174 Q 200 180 208 174" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />

        {/* Swaddle Blanket Front Fold */}
        <path d="M 115 300 Q 200 170 285 300 Z" fill="#f8fafc" opacity="0.9" />
        <path d="M 120 300 L 200 200 L 280 300" fill="none" stroke="#cbd5e1" strokeWidth="2" />

        {/* AI Region Box Overlay (Normal Image view) */}
        {!showHeatmap && (
          <g opacity="0.6">
            <rect x="130" y="115" width="140" height="90" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" rx="8" />
            <text x="200" y="110" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
              DETECTION WINDOW
            </text>
          </g>
        )}

        {/* Grad-CAM Heatmap layer */}
        {showHeatmap && (
          <g>
            {/* The heat focus is rendered over the skin area where bilirubin reflects Jaundice */}
            <rect 
              x="130" 
              y="120" 
              width="140" 
              height="80" 
              fill={
                riskLevel === "High Risk" 
                  ? "url(#heatmapHigh)" 
                  : riskLevel === "Moderate Risk" 
                    ? "url(#heatmapMid)" 
                    : "url(#heatmapLow)"
              }
              rx="40"
              className="mix-blend-color-burn" 
            />
            {/* Small glowing indicators representing focal points */}
            {riskLevel === "High Risk" && (
              <>
                <circle cx="200" cy="145" r="14" fill="#ef4444" opacity="0.8" filter="url(#glow)" />
                <circle cx="165" cy="155" r="10" fill="#f97316" opacity="0.6" filter="url(#glow)" />
                <circle cx="235" cy="155" r="10" fill="#f97316" opacity="0.6" filter="url(#glow)" />
              </>
            )}
            {riskLevel === "Moderate Risk" && (
              <circle cx="195" cy="150" r="15" fill="#f97316" opacity="0.7" filter="url(#glow)" />
            )}
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative select-none">
      
      {/* Top Banner overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-950/80 text-teal-400 border border-teal-500/30 backdrop-blur-md rounded-full shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          Explainable AI (XAI) Active
        </span>
        <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-md rounded-full shadow-lg">
          <Eye className="w-3.5 h-3.5" />
          {riskLevel} - {confidence}% Confidence
        </span>
      </div>

      {/* Visualizer Area */}
      <div 
        ref={containerRef}
        onMouseMove={(e) => isDragging.current && handleMove(e.clientX)}
        onTouchMove={handleTouchMove}
        className="w-full relative h-[300px] cursor-ew-resize overflow-hidden"
      >
        {/* Layer 1: Heatmap (Background) */}
        <div className="absolute inset-0 w-full h-full">
          <BabyFaceSVG showHeatmap={true} />
          {/* Label bottom right */}
          <div className="absolute bottom-4 right-4 bg-slate-950/75 border border-rose-500/20 px-2.5 py-1 rounded text-[10px] font-bold text-rose-400 tracking-wider backdrop-blur-xs">
            GRAD-CAM HEATMAP
          </div>
        </div>

        {/* Layer 2: Original Image (Foreground, clipped) */}
        <div 
          className="absolute inset-0 h-full overflow-hidden border-r border-teal-400/50"
          style={{ width: `${sliderPosition}%` }}
        >
          {/* Must keep the width 100% of container so it aligns properly under clipping */}
          <div className="absolute inset-0 h-full" style={{ width: containerRef.current?.getBoundingClientRect().width || 500 }}>
            <BabyFaceSVG showHeatmap={false} />
          </div>
          {/* Label bottom left */}
          <div className="absolute bottom-4 left-4 bg-slate-950/75 border border-teal-500/20 px-2.5 py-1 rounded text-[10px] font-bold text-teal-400 tracking-wider backdrop-blur-xs">
            ORIGINAL SCAN
          </div>
        </div>

        {/* Divider Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-10 cursor-ew-resize flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            className="w-8 h-8 rounded-full bg-teal-400 text-teal-950 flex items-center justify-center shadow-lg border-2 border-white pointer-events-auto hover:scale-110 active:scale-95 transition-transform duration-100"
          >
            <svg className="w-4 h-4 fill-current rotate-90" viewBox="0 0 24 24">
              <path d="M8 8H6v8h2v2H4V6h4v2zm8 8h2V8h-2V6h4v12h-4v-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Control bar bottom */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-clinical-400" />
          Drag slider to compare raw patient scan with neural network focus points
        </span>
        <button 
          onClick={() => setSliderPosition(sliderPosition === 0 ? 100 : sliderPosition === 100 ? 50 : 0)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors rounded-lg font-medium"
        >
          Toggle Split
        </button>
      </div>
    </div>
  );
};
