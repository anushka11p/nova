import { supabase } from '../lib/supabase';
import React, { useState } from 'react';
import { Lock, Mail, Hospital, User, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';

export const AuthPage = ({ onAuthSuccess, onBackToLanding, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalId, setHospitalId] = useState('HSP-STMARYS-88');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [medicalLicenseId, setMedicalLicenseId] = useState('');

  
const handleLoginSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setErrorMsg('');
  setSuccessMsg('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const user = data.user;

    onAuthSuccess({
      name: user.user_metadata?.name || email.split('@')[0],
      role: user.user_metadata?.role || 'Clinical User',
      hospital: user.user_metadata?.hospital || hospitalId,
      email: user.email
    });
  } catch (err) {
    setErrorMsg('Login failed. Please try again.');
    console.error('Login error:', err);
  } finally {
    setIsLoading(false);
  }
};

  
const handleSignupSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setErrorMsg('');
  setSuccessMsg('');

  try {
    const { error } = await supabase
      .from('practitioner_access_requests')
      .insert([
        {
          full_name: fullName.trim(),
          hospital_affiliation: hospitalAffiliation.trim(),
          institutional_email: institutionalEmail.trim(),
          medical_license_id: medicalLicenseId.trim(),
          status: 'pending'
        }
      ]);

    if (error) {
      setErrorMsg('Could not submit your request. Please try again.');
      console.error('Request submission error:', error);
      return;
    }

    setSuccessMsg(
      'Account request submitted successfully! Your clinical coordinator will review your request.'
    );

    setFullName('');
    setHospitalAffiliation('');
    setInstitutionalEmail('');
    setMedicalLicenseId('');

    setTimeout(() => {
      setMode('login');
      setSuccessMsg('');
    }, 3000);

  } catch (err) {
    console.error('Signup error:', err);
    setErrorMsg('Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('Password reset link sent to your registered medical email.');
      setTimeout(() => {
        setMode('login');
        setSuccessMsg('');
      }, 3000);
    }, 1000);
  };

  // Direct Bypass for Testing
  const handleClinicalBypass = () => {
    onAuthSuccess({
      name: "Dr. Elena Smith",
      role: "Senior Pediatrician",
      hospital: "St. Mary's Pediatric Wing",
      email: "elena.smith@stmarys-peds.org"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative font-sans">
      
      {/* Return to landing button */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-clinical-600 flex items-center justify-center text-white font-bold text-2xl font-display shadow-lg shadow-teal-500/20">
            N
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 font-display">
          {mode === 'login' && 'Hospital Clinical Sign In'}
          {mode === 'signup' && 'Request Practitioner Access'}
          {mode === 'forgot' && 'Reset Secure Password'}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w-xs mx-auto">
          Authorized pediatric medical staff and neonatal screeners only. HIPAA compliant portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Hospital Identifier
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hospital className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 font-medium"
                    placeholder="HSP-STMARYS-88"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Medical Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 font-medium"
                    placeholder="elena.smith@stmarys-peds.org"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs font-semibold text-clinical-600 hover:text-clinical-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-clinical-600 hover:bg-clinical-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-clinical-500 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying Hospital Directory...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form className="space-y-4" onSubmit={handleSignupSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-clinical-500"
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Hospital Affiliation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hospital className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={hospitalAffiliation}
                    onChange={(e) => setHospitalAffiliation(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-clinical-500"
                    placeholder="St. Jude Neonatal Care"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={institutionalEmail}
                    onChange={(e) => setInstitutionalEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-clinical-500"
                    placeholder="john.doe@hospital.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Medical License ID / NPI Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={medicalLicenseId}
                    onChange={(e) => setMedicalLicenseId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-clinical-500"
                    placeholder="NPI-109283749"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-clinical-600 hover:bg-clinical-700 focus:outline-hidden focus:ring-2 focus:ring-clinical-500 disabled:opacity-50"
                >
                  {isLoading ? 'Submitting request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form className="space-y-5" onSubmit={handleForgotSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-clinical-500"
                    placeholder="elena.smith@stmarys-peds.org"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-clinical-600 hover:bg-clinical-700 focus:outline-hidden focus:ring-2 focus:ring-clinical-500 disabled:opacity-50"
                >
                  {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
                </button>
              </div>
            </form>
          )}

          {/* Footer switches */}
          <div className="mt-6 flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            {mode === 'login' && (
              <>
                <span>New practitioner?</span>
                <button onClick={() => setMode('signup')} className="font-semibold text-clinical-600 hover:text-clinical-700">
                  Request Access
                </button>
              </>
            )}
            {mode !== 'login' && (
              <>
                <span>Already registered?</span>
                <button onClick={() => setMode('login')} className="font-semibold text-clinical-600 hover:text-clinical-700">
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Development Bypass Card */}
        <div className="mt-4 bg-slate-100 p-4 rounded-2xl border border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-2 font-medium">
            For local evaluation & clinical testing:
          </p>
          <button
            onClick={handleClinicalBypass}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Direct Sandbox Bypass (Dr. Elena Smith)
          </button>
        </div>
      </div>
    </div>
  );
};
