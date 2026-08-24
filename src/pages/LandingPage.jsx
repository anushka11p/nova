import React, { useState } from 'react';
import { ShieldCheck, Play, ArrowRight, Activity, Cpu, Sparkles, HeartHandshake, PhoneCall } from 'lucide-react';

export const LandingPage = ({ onNavigate, onStartScreening }) => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-clinical-600 flex items-center justify-center text-white font-bold text-lg font-display">
              N
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800 font-display tracking-tight">Nova</span>
              <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Clinical Portal</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="text-clinical-600 border-b-2 border-clinical-600 pb-1">Home</a>
            <a href="#about" className="hover:text-clinical-600 transition-colors">About</a>
            <a href="#features" className="hover:text-clinical-600 transition-colors">Features</a>
            <button onClick={onStartScreening} className="hover:text-clinical-600 transition-colors cursor-pointer">Detection</button>
            <button onClick={() => onNavigate('dashboard', 'reports')} className="hover:text-clinical-600 transition-colors cursor-pointer">Reports</button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('auth', 'login')} 
              className="text-sm font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
            >
              Sign In
            </button>
            <button 
              onClick={onStartScreening}
              className="flex items-center gap-2 px-5 py-2.5 bg-clinical-600 text-white rounded-full text-sm font-bold shadow-sm hover:bg-clinical-700 transition-all hover:scale-[1.02]"
            >
              <Activity className="w-4 h-4" />
              Upload Image
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex-1 grid md:grid-cols-12 gap-12 items-center">
        {/* Left Hero Column */}
        <div className="md:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Clinical Grade AI
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-tight font-display">
            AI-Based Neonatal Jaundice Detection System
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-xl leading-relaxed">
            A non-invasive, AI-powered screening system for detecting neonatal jaundice from medical images. Provide instant, accurate screening without painful blood tests.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button 
              onClick={onStartScreening}
              className="flex items-center gap-2 px-6 py-3.5 bg-clinical-600 text-white rounded-xl text-base font-bold shadow-md hover:bg-clinical-700 transition-all hover:scale-[1.02]"
            >
              <Activity className="w-5 h-5" />
              Start Screening
            </button>

            <button 
              onClick={() => setShowDemo(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-base font-semibold shadow-xs hover:bg-slate-50 transition-all"
            >
              <Play className="w-5 h-5 fill-slate-700" />
              Watch Demo
            </button>
          </div>

          {/* Doctors Endorsements */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150" alt="Doctor 1" />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150" alt="Doctor 2" />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150" alt="Doctor 3" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Trusted by <span className="font-bold text-slate-700">500+ neonatologists</span> worldwide for clinical pre-screening.
            </p>
          </div>
        </div>

        {/* Right Hero Column: Real-time Analysis Card */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-4 relative group hover:shadow-2xl transition-all duration-300">
            {/* Top Indicator */}
            <div className="flex justify-between items-center mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 tracking-wide">Real-time Analysis</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Scan #0427</span>
            </div>

            {/* Baby Image Container with Custom SVG Baby */}
            <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center">
              {/* Custom SVG Baby Face inside the Card */}
              <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
                <rect width="400" height="225" fill="#0f172a" />
                <path d="M 80 225 Q 200 100 320 225 Z" fill="#f8fafc" />
                <circle cx="200" cy="115" r="50" fill="#e0ab44" /> {/* Jaundiced skin */}
                <path d="M 150 115 A 50 50 0 0 1 250 115 Q 200 95 150 115" fill="#bae6fd" />
                
                {/* Closed Eyes */}
                <path d="M 172 120 Q 180 126 188 120" fill="none" stroke="#5c4d3c" strokeWidth="2" strokeLinecap="round" />
                <path d="M 212 120 Q 220 126 228 120" fill="none" stroke="#5c4d3c" strokeWidth="2" strokeLinecap="round" />
                
                {/* Mouth & Nose */}
                <path d="M 197 130 Q 200 133 203 130" fill="none" stroke="#5c4d3c" strokeWidth="1.5" />
                <path d="M 194 142 Q 200 146 206 142" fill="none" stroke="#e11d48" strokeWidth="2" />
                <path d="M 100 225 L 200 160 L 300 225" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
              </svg>

              {/* Bounding Box overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[140px] h-[95px] border-2 border-dashed border-emerald-400 rounded-lg flex flex-col justify-between p-1.5 animate-pulse">
                  <span className="text-[8px] bg-emerald-400/90 text-emerald-950 font-extrabold px-1 rounded-sm uppercase tracking-wider self-start leading-none py-0.5">
                    Neonatal Bilirubin Zone
                  </span>
                  <span className="text-[8px] text-emerald-400 font-bold self-end tracking-wider">
                    SCAN OK
                  </span>
                </div>
              </div>
            </div>

            {/* Results Progress section */}
            <div className="mt-4 space-y-2 px-1">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full w-[94.8%] animate-pulse" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Confidence Score</span>
                <span className="font-bold text-slate-800">94.8%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="bg-white border-t border-slate-100 py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-display">
              Advanced Clinical Functionality
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
              Nova uses deep learning to process facial dermal pixels, mapping them to bilirubin concentration curves.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-clinical-200 transition-colors space-y-4">
              <div className="w-12 h-12 bg-clinical-50 text-clinical-600 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Deep Convolutional Network</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trained on annotated multi-ethnic clinical datasets of newborn skin tones to map dermal color index to lab-confirmed total serum bilirubin (TSB).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-clinical-200 transition-colors space-y-4">
              <div className="w-12 h-12 bg-clinical-50 text-clinical-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Explainable AI (Grad-CAM)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generates spatial heatmaps showing where the AI focused its analysis, ensuring complete visual accountability for clinicians.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-clinical-200 transition-colors space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-clinical-50 text-clinical-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Instant Pre-Screening</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Allows neonatal nurses and pediatricians to screen infants in seconds during standard rounds, minimizing painful heel-stick blood draws.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-display">
            Healthy Beginnings, Powered by AI.
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Neonatal jaundice affects up to 60% of term and 80% of preterm infants. Delays in identifying hyperbilirubinemia can lead to severe neurological conditions such as kernicterus. 
          </p>
          <p className="text-slate-600 leading-relaxed">
            Nova provides clinical staff with a frictionless, high-accuracy digital screening tool. By taking or uploading a standard digital photograph of the newborn's face, Nova's AI processes dermal reflectance and returns risk level guidelines in under two seconds.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-clinical-600" />
              <span className="text-sm font-bold text-slate-700">Patient-First Care</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-clinical-600" />
              <span className="text-sm font-bold text-slate-700">96.4% Sensitivity</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 bg-gradient-to-tr from-clinical-600 to-teal-500 p-8 rounded-3xl text-white space-y-6 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">AI Model Information</span>
            <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold">RESEARCH v2.1</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-bold">Neural Architecture</h4>
              <p className="text-sm text-teal-50 opacity-90">Modified MobileNetV3 backbone optimized for mobile clinical cameras, calibrated for light and dark baby skin phototypes.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white/10 p-3 rounded-xl">
                <span className="block text-2xl font-bold font-display">96.4%</span>
                <span className="text-xs text-teal-100">Sensitivity (Jaundice)</span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <span className="block text-2xl font-bold font-display">&lt; 1.5s</span>
                <span className="text-xs text-teal-100">Processing Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 rounded-md bg-clinical-500 flex items-center justify-center font-bold text-sm">
                N
              </div>
              <span className="font-bold text-base font-display">Nova</span>
            </div>
            <p className="text-xs">
              AI-powered non-invasive neonatal jaundice screening software. Empowering clinical diagnostics.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Clinical Resources</h4>
            <ul className="text-xs space-y-2">
              <li><a href="#about" className="hover:text-white transition-colors">Research Paper (PDF)</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Grad-CAM Calibration</a></li>
              <li><a href="#home" className="hover:text-white transition-colors">Bilirubin Curve Charting</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Platform Links</h4>
            <ul className="text-xs space-y-2">
              <li><button onClick={onStartScreening} className="hover:text-white text-left transition-colors">Start Screening</button></li>
              <li><button onClick={() => onNavigate('auth', 'login')} className="hover:text-white text-left transition-colors">Doctor Log In</button></li>
              <li><button onClick={() => onNavigate('dashboard', 'settings')} className="hover:text-white text-left transition-colors">Vite Config/Settings</button></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="text-white font-bold text-sm mb-3">Institutional Support</h4>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-clinical-400" />
              <span>Support: +1 (555) NEO-CARE</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-2">
              This application is intended for screening and research purposes only and does not replace professional medical diagnosis.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs gap-4 text-slate-500">
          <span>&copy; {new Date().getFullYear()} Nova Jaundice AI. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#home" className="hover:underline">Privacy Policy</a>
            <a href="#home" className="hover:underline">Terms of Service</a>
            <a href="#home" className="hover:underline">HIPAA Compliance</a>
          </div>
        </div>
      </footer>

      {/* Watch Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-xl w-full border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Nova Walkthrough Demo</h3>
              <button onClick={() => setShowDemo(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
            </div>
            
            {/* Mock Video player container */}
            <div className="aspect-video bg-slate-950 border border-slate-800 rounded-xl relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,128,128,0.2)_0%,transparent_70%)] animate-pulse" />
              <div className="z-10 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-clinical-600 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Play className="w-6 h-6 fill-white ml-1" />
                </div>
                <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase">Playing Demo Video</p>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto">Showing: Patient onboarding, mobile photo captures, AI preprocessing, and phototherapy matching.</p>
              </div>
            </div>
            
            <div className="text-right">
              <button 
                onClick={() => { setShowDemo(false); onStartScreening(); }} 
                className="px-5 py-2 bg-clinical-600 text-white text-sm font-bold rounded-xl hover:bg-clinical-700"
              >
                Go to Screening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
