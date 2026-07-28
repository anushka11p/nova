import React, { useState } from 'react';

// 1. Weekly Screenings Line Chart
export const WeeklyScreeningsChart = () => {
  const data = [
    { day: "Mon", count: 18 },
    { day: "Tue", count: 24 },
    { day: "Wed", count: 15 },
    { day: "Thu", count: 32 },
    { day: "Fri", count: 28 },
    { day: "Sat", count: 12 },
    { day: "Sun", count: 14 }
  ];

  const maxVal = 40;
  const height = 200;
  const width = 500;
  const padding = 40;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2) / (data.length - 1));
    const y = height - padding - (d.count * (height - padding * 2) / maxVal);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Gradient area path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-base font-semibold text-slate-800">Weekly Screening Volume</h4>
          <p className="text-xs text-slate-500">Total screenings per day for the current week</p>
        </div>
        <span className="text-xs font-medium text-clinical-600 bg-clinical-50 px-2.5 py-1 rounded-full">
          Avg: 20.4/day
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#008080" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#008080" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 10, 20, 30, 40].map((val, idx) => {
            const y = height - padding - (val * (height - padding * 2) / maxVal);
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={padding - 10} 
                  y={y + 4} 
                  className="text-[10px] font-medium fill-slate-400 text-right"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path d={areaD} fill="url(#lineGrad)" />

          {/* Main line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#008080" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Dots on line */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint === i ? 6 : 4}
              className="fill-white stroke-clinical-600 cursor-pointer transition-all duration-200"
              strokeWidth={hoveredPoint === i ? 3 : 2}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* X Axis Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - padding + 20}
              className="text-[11px] font-medium fill-slate-500"
              textAnchor="middle"
            >
              {p.day}
            </text>
          ))}
        </svg>

        {/* Custom tooltip */}
        {hoveredPoint !== null && (
          <div 
            className="absolute bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-md -translate-x-1/2 -translate-y-12 pointer-events-none transition-all duration-200"
            style={{
              left: `${(points[hoveredPoint].x / width) * 100}%`,
              top: `${(points[hoveredPoint].y / height) * 100}%`
            }}
          >
            <div className="font-semibold">{points[hoveredPoint].day}</div>
            <div>{points[hoveredPoint].count} Screenings</div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Prediction Distribution Bar Chart
export const PredictionDistributionChart = () => {
  const data = [
    { label: "Normal", count: 280, color: "from-emerald-400 to-emerald-500" },
    { label: "Mild Bilirubin", count: 114, color: "from-amber-400 to-amber-500" },
    { label: "Jaundice", count: 38, color: "from-rose-400 to-rose-500" }
  ];

  const maxVal = 300;
  const height = 200;
  const width = 400;
  const paddingLeft = 100;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 20;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <h4 className="text-base font-semibold text-slate-800">Prediction Distribution</h4>
        <p className="text-xs text-slate-500">Historical outcome split since system launch</p>
      </div>

      <div className="mt-6 space-y-4">
        {data.map((item, idx) => {
          const percentage = (item.count / maxVal) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.count} cases</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Risk Level Breakdown Donut Chart
export const RiskLevelBreakdownChart = () => {
  // Calculations for Donut Chart
  // Radius: 50, StrokeWidth: 16 -> circumference = 2 * PI * r = 314
  // Normal: 65% (Green), Moderate: 26% (Yellow), High: 9% (Red)
  const segments = [
    { label: "Normal (Low)", value: 65, strokeDash: "204 314", strokeOffset: "0", color: "#10b981" },
    { label: "Moderate Risk", value: 26, strokeDash: "82 314", strokeOffset: "-204", color: "#f59e0b" },
    { label: "High Risk", value: 9, strokeDash: "28 314", strokeOffset: "-286", color: "#ef4444" }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-full">
      <div>
        <h4 className="text-base font-semibold text-slate-800">Risk Level Breakdown</h4>
        <p className="text-xs text-slate-500">Overall risk classification ratios</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around my-4 gap-4">
        {/* Donut Graphic */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
            
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={seg.strokeDash}
                strokeDashoffset={seg.strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out hover:opacity-85 cursor-pointer"
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">432</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Screened</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600 font-medium">{seg.label}</span>
              <span className="text-slate-400 ml-auto">{seg.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
