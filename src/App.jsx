import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

function App() {
  // Navigation State: 'landing' | 'auth' | 'dashboard'
  const [page, setPage] = useState('landing');
  
  // Sub-navigation targets
  const [authMode, setAuthMode] = useState('login');
  const [dashboardTab, setDashboardTab] = useState('dashboard');
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(null);

  // Global Toast State
  const [toasts, setToasts] = useState([]);

  // Toast dispatch utility
  const showToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth state triggers
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}! Secure terminal session initialized.`, 'success');
    setPage('dashboard');
    setDashboardTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Secure session closed. Terminal logged out.', 'info');
    setPage('landing');
  };

  // Navigators
  const navigateToPage = (targetPage, subTarget = '') => {
    if (targetPage === 'dashboard' && !currentUser) {
      // Redirect to login if accessing dashboard without credentials
      setAuthMode('login');
      setPage('auth');
      showToast('Authentication required to access the clinical portal.', 'warning');
      return;
    }

    if (targetPage === 'auth') {
      setAuthMode(subTarget || 'login');
    } else if (targetPage === 'dashboard') {
      setDashboardTab(subTarget || 'dashboard');
    }
    
    setPage(targetPage);
  };

  // Custom Toast Icon Selector
  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'error':
        return 'border-rose-200 bg-rose-50 text-rose-800';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-855';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen text-slate-800 relative bg-slate-50 font-sans">
      
      {/* Route Switcher */}
      {page === 'landing' && (
        <LandingPage 
          onNavigate={navigateToPage} 
          onStartScreening={() => {
            if (currentUser) {
              navigateToPage('dashboard', 'new-screening');
            } else {
              navigateToPage('auth', 'login');
              showToast('Please sign in or select clinical bypass to initialize screenings.', 'info');
            }
          }}
        />
      )}

      {page === 'auth' && (
        <AuthPage 
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess}
          onBackToLanding={() => setPage('landing')}
        />
      )}

      {page === 'dashboard' && (
        <DashboardPage 
          currentUser={currentUser}
          initialTab={dashboardTab}
          onLogout={handleLogout}
          showToast={showToast}
        />
      )}

      {/* Global Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full no-print">
        {toasts.map((t) => (
          <div 
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 animate-slide-in font-sans font-medium text-xs ${getToastBorder(t.type)}`}
          >
            <div className="shrink-0 mt-0.5">{getToastIcon(t.type)}</div>
            <div className="flex-1 leading-relaxed">{t.message}</div>
            <button 
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
