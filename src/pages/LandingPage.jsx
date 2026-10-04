import React from 'react';
import { Activity, ArrowRight, Camera, Cpu, FlaskConical, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react';

import metrics from '../../model_metrics.json';

const pct = (p, d = 1) => `${(p * 100).toFixed(d)}%`;

// Real example for the hero card: sample photo A (public/samples/sample-a.jpg), a jaundice photo from the
// dataset, scored by the installed model. Update these numbers if the model is replaced.
const EXAMPLE = { photo: '/samples/sample-a.jpg', probability: 0.565 };

export const LandingPage = ({ onNavigate, onStartScreening }) => {
  const t = metrics.test;
  const threshold = metrics.threshold;
  const exampleHigh = EXAMPLE.probability >= threshold;

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
              <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Jaundice screening</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="text-clinical-600 border-b-2 border-clinical-600 pb-1">Home</a>
            <a href="#features" className="hover:text-clinical-600 transition-colors">How it works</a>
            <a href="#about" className="hover:text-clinical-600 transition-colors">About</a>
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
              Start screening
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex-1 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold uppercase tracking-wider">
            <FlaskConical className="w-3.5 h-3.5" />
            Research prototype · screening aid
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-tight font-display">
            AI-assisted neonatal jaundice screening
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-xl leading-relaxed">
            Photograph a newborn during the routine check and Nova estimates how likely the photo shows visible jaundice,
            then sorts the result into Normal, Borderline or High risk with next steps. It helps decide which babies need a
            bilirubin test; it does not replace one.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartScreening}
              className="flex items-center gap-2 px-6 py-3.5 bg-clinical-600 text-white rounded-xl text-base font-bold shadow-md hover:bg-clinical-700 transition-all hover:scale-[1.02]"
            >
              <Activity className="w-5 h-5" />
              Start screening
            </button>
            <a
              href="#features"
              className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-base font-semibold shadow-xs hover:bg-slate-50 transition-all"
            >
              How it works
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <p className="text-sm text-slate-500 pt-4 border-t border-slate-100 max-w-xl">
            Measured on {t.n} test photos the model never saw: it caught{' '}
            <span className="font-semibold text-slate-700">{pct(t.sensitivity)}</span> of jaundice cases and correctly cleared{' '}
            <span className="font-semibold text-slate-700">{pct(t.specificity)}</span> of normal babies.
          </p>
        </div>

        {/* Right Hero Column: a real example result */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-4">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-bold text-slate-700 tracking-wide">Example result</span>
              <span className="text-[11px] text-slate-400 font-semibold">Sample photo A</span>
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden">
              <img src={EXAMPLE.photo} alt="Sample newborn photo from the training dataset's test images" className="w-full h-full object-cover" />
            </div>

            <div className="mt-4 space-y-3 px-1">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ring-1 ring-inset ${
                    exampleHigh ? 'bg-red-50 text-red-700 ring-red-600/20' : 'bg-amber-50 text-amber-800 ring-amber-600/25'
                  }`}
                >
                  <TriangleAlert className="w-3.5 h-3.5" />
                  {exampleHigh ? 'High risk' : 'Borderline'}
                </span>
                <span className="text-xs text-slate-500">Bilirubin check needed</span>
              </div>
              <div className="relative w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: `${EXAMPLE.probability * 100}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-slate-900/70" style={{ left: `${threshold * 100}%` }} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Jaundice likelihood</span>
                <span className="font-bold text-slate-800">
                  {pct(EXAMPLE.probability)} <span className="font-normal text-slate-400">(cut-off {pct(threshold, 0)})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="features" className="bg-white border-t border-slate-100 py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-display">How Nova works</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
              A trained image model reads the whole photo and estimates the likelihood of visible jaundice. It does not measure bilirubin.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="w-12 h-12 bg-clinical-50 text-clinical-600 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Trained image model</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                An EfficientNetV2B0 network trained on {metrics.split_sizes.train + metrics.split_sizes.val + metrics.split_sizes.test} newborn
                photos (jaundice and normal), with {metrics.split_sizes.test} photos held back to measure how well it works.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="w-12 h-12 bg-clinical-50 text-clinical-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Built for screening</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The cut-off is set to catch at least 90% of jaundice on validation photos, so it prefers a false alarm to a missed baby.
                Borderline results are shown as borderline, and every result points to the bilirubin test.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-clinical-50 text-clinical-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Quick at the bedside</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Take or upload a photo and get a risk level with next steps in seconds. Records, analytics and printable reports in the
                web portal; a phone app that works offline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-display">Healthy Beginnings, Powered by AI.</h2>
          <p className="text-slate-600 leading-relaxed">
            Neonatal jaundice affects up to 60% of term and 80% of preterm infants. Delays in identifying hyperbilirubinemia can lead
            to severe neurological conditions such as kernicterus.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Nova gives nursing and medical staff a quick, non-invasive first look during the routine newborn check: take or upload a
            photo of the baby, and the model returns a risk level and next steps. Babies it flags get a bilirubin measurement; Nova
            does not replace one.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-clinical-600" />
              <span className="text-sm font-bold text-slate-700">Screening aid, not a diagnosis</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-clinical-600" />
              <span className="text-sm font-bold text-slate-700">Offline phone app</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 bg-gradient-to-tr from-clinical-600 to-teal-500 p-8 rounded-3xl text-white space-y-6 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">AI model</span>
            <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold">RESEARCH PROTOTYPE</span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-bold">{metrics.model}</h4>
              <p className="text-sm text-teal-50 opacity-90">
                Trained on photos from a single source. Not yet tested across skin tones, cameras or lighting, and not clinically validated.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white/10 p-3 rounded-xl">
                <span className="block text-2xl font-bold font-display">{pct(t.sensitivity)}</span>
                <span className="text-xs text-teal-100">Jaundice caught (sensitivity)</span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <span className="block text-2xl font-bold font-display">{pct(t.specificity)}</span>
                <span className="text-xs text-teal-100">Normal babies cleared (specificity)</span>
              </div>
            </div>
            <p className="text-xs text-teal-100">On {t.n} test photos the model never saw, at the {pct(threshold, 0)} cut-off.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 rounded-md bg-clinical-500 flex items-center justify-center font-bold text-sm">N</div>
              <span className="font-bold text-base font-display">Nova</span>
            </div>
            <p className="text-xs">AI-assisted neonatal jaundice screening aid for research and pilot use.</p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Nova</h4>
            <ul className="text-xs space-y-2">
              <li><button onClick={onStartScreening} className="hover:text-white text-left transition-colors">Start screening</button></li>
              <li><button onClick={() => onNavigate('auth', 'login')} className="hover:text-white text-left transition-colors">Sign in</button></li>
              <li><a href="#features" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="text-white font-bold text-sm mb-3">Important</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nova is for screening, research and education. It does not diagnose jaundice and is not an approved medical device.
              Every result must be reviewed by a qualified clinician and confirmed with a bilirubin measurement.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Nova</span>
        </div>
      </footer>
    </div>
  );
};
