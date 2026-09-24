import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, ChevronDown, Gauge, HelpCircle, LayoutDashboard, LogOut, Menu, Plus, ScanLine, Search, Settings as SettingsIcon, Users, X } from 'lucide-react';

import { Overview } from '../portal/screens/Overview';
import { NewScreening } from '../portal/screens/NewScreening';
import { Result } from '../portal/screens/Result';
import { Records } from '../portal/screens/Records';
import { Report } from '../portal/screens/Report';
import { Analytics } from '../portal/screens/Analytics';
import { Model } from '../portal/screens/Model';
import { Settings } from '../portal/screens/Settings';
import { Help } from '../portal/screens/Help';
import { Avatar, Button, NovaMark } from '../portal/ui';

const NAV_GROUPS = [
  {
    label: 'Screening',
    items: [
      { route: 'overview', label: 'Overview', icon: LayoutDashboard },
      { route: 'new', label: 'New screening', icon: ScanLine },
      { route: 'records', label: 'Patient records', icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [
      { route: 'analytics', label: 'Analytics', icon: BarChart3 },
      { route: 'model', label: 'Screening model', icon: Gauge },
    ],
  },
  {
    label: 'Support',
    items: [
      { route: 'settings', label: 'Settings', icon: SettingsIcon },
      { route: 'help', label: 'Help', icon: HelpCircle },
    ],
  },
];
const TITLES = { overview: 'Overview', new: 'New screening', records: 'Patient records', record: 'Screening result', report: 'Report', analytics: 'Analytics', model: 'Screening model', settings: 'Settings', help: 'Help' };

const LEGACY_TABS = { dashboard: 'overview', 'new-screening': 'new', 'patient-records': 'records' };
const DEFAULTS_KEY = 'nova.screeningDefaults';

function readHash() {
  const [route = 'overview', id] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { route: route || 'overview', id: id ? decodeURIComponent(id) : null };
}

function loadDefaults(user) {
  const fallback = { hospital: user?.hospital || '', doctor: user?.name || '' };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}') };
  } catch {
    return fallback;
  }
}

export const DashboardPage = ({ currentUser, onLogout, initialTab = 'dashboard', showToast }) => {
  const [loc, setLoc] = useState(() => (window.location.hash ? readHash() : { route: LEGACY_TABS[initialTab] || 'overview', id: null }));
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState('checking');
  const [defaults, setDefaults] = useState(() => loadDefaults(currentUser));
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [search, setSearch] = useState('');
  const userMenuRef = useRef(null);

  const go = useCallback((route, id = null) => {
    const hash = `#/${route}${id ? `/${encodeURIComponent(id)}` : ''}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    setLoc({ route, id });
    setMenuOpen(false);
    document.getElementById('portal-main')?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setLoc(readHash());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.history.replaceState(null, '', `#/${loc.route}`);
    return () => window.removeEventListener('hashchange', onHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/records').then((r) => (r.ok ? r.json() : [])).then(setRecords).catch(() => setRecords([])).finally(() => setLoadingRecords(false));
    fetch('/api/model/metrics').then((r) => (r.ok ? r.json() : null)).then(setMetrics).catch(() => setMetrics(null));
    const check = () => fetch('/api/health').then((r) => r.json()).then((d) => setHealth(d.model)).catch(() => setHealth('offline'));
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userMenu) return;
    const close = (e) => { if (!userMenuRef.current?.contains(e.target)) setUserMenu(false); };
    const esc = (e) => e.key === 'Escape' && setUserMenu(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [userMenu]);

  const recordKey = (r) => `${r.patientId}~${r.createdAt || r.date}`;
  const selected = loc.id ? records.find((r) => recordKey(r) === loc.id) : null;
  const open = (r) => go('record', recordKey(r));
  const print = (r) => go('report', recordKey(r));
  const navRoute = loc.route === 'record' || loc.route === 'report' ? 'records' : loc.route;

  function saveDefaults(next) {
    setDefaults(next);
    try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(next)); } catch { /* private mode: keep for this session */ }
    showToast('Settings saved.', 'success');
  }

  function submitSearch(e) {
    e.preventDefault();
    go('records');
  }

  let screen;
  if ((loc.route === 'record' || loc.route === 'report') && !selected) {
    screen = loadingRecords ? null : (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
        <p className="text-[15px] font-semibold text-slate-900">Record not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been removed.</p>
        <Button className="mt-4" variant="secondary" onClick={() => go('records')}>Back to records</Button>
      </div>
    );
  } else {
    switch (loc.route) {
      case 'new':
        screen = <NewScreening defaults={defaults} metrics={metrics} showToast={showToast} onScreened={(r) => setRecords((prev) => [r, ...prev])} onOpenResult={open} onPrint={print} />;
        break;
      case 'record':
        screen = <Result record={selected} metrics={metrics} onBack={() => go('records')} onPrint={print} onNew={() => go('new')} />;
        break;
      case 'report':
        screen = <Report record={selected} metrics={metrics} onBack={() => open(selected)} />;
        break;
      case 'records':
        screen = <Records key={search} records={records} metrics={metrics} loading={loadingRecords} onOpen={open} onNew={() => go('new')} initialQuery={search} />;
        break;
      case 'analytics':
        screen = <Analytics records={records} metrics={metrics} onNew={() => go('new')} />;
        break;
      case 'model':
        screen = <Model metrics={metrics} health={health} />;
        break;
      case 'settings':
        screen = <Settings defaults={defaults} onSaveDefaults={saveDefaults} metrics={metrics} health={health} />;
        break;
      case 'help':
        screen = <Help />;
        break;
      default:
        screen = <Overview records={records} metrics={metrics} health={health} userName={currentUser?.name} onNew={() => go('new')} onOpen={open} onRecords={() => go('records')} onModel={() => go('model')} />;
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={() => go('overview')}
        aria-label="Nova home"
        className="flex items-center gap-2.5 px-5 h-16 shrink-0 w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
      >
        <NovaMark />
        <div>
          <p className="text-[15px] font-semibold text-slate-900 leading-tight">Nova</p>
          <p className="text-[11px] text-slate-500 leading-tight">Jaundice screening</p>
        </div>
      </button>
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[11px] font-medium text-slate-400">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ route, label, icon: Icon }) => {
                const active = navRoute === route;
                return (
                  <li key={route}>
                    <button
                      type="button"
                      onClick={() => go(route)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors cursor-pointer ${
                        active ? 'bg-brand-soft text-brand font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
        <p className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
          <span className={`w-2 h-2 rounded-full ${health === 'online' ? 'bg-emerald-500' : health === 'offline' ? 'bg-red-500' : 'bg-slate-300'}`} aria-hidden="true" />
          Model {health === 'online' ? 'online' : health === 'offline' ? 'offline' : 'checking'}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 truncate">{metrics?.model || 'Loading model details'}</p>
      </div>
    </div>
  );

  return (
    <div className="portal font-sans text-slate-900 bg-slate-50 h-screen flex overflow-hidden">
      <aside className="no-print hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200">{sidebar}</aside>

      {menuOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl" aria-label="Menu">
            <button type="button" onClick={() => setMenuOpen(false)} className="absolute top-4 right-3 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print h-16 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setMenuOpen(true)} className="lg:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <p className="hidden sm:block text-sm text-slate-500 whitespace-nowrap">
            Nova <span className="mx-1.5 text-slate-300">/</span> <span className="font-medium text-slate-900">{TITLES[loc.route] || 'Overview'}</span>
          </p>
          <form onSubmit={submitSearch} className="ml-auto relative w-full max-w-[280px] hidden md:block" role="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients…"
              aria-label="Search patients"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand-ring/60"
            />
          </form>
          <Button icon={Plus} className="ml-auto md:ml-0" onClick={() => go('new')}>
            <span className="hidden sm:inline">New screening</span>
            <span className="sm:hidden">New</span>
          </Button>
          <div className="relative" ref={userMenuRef}>
            <button type="button" onClick={() => setUserMenu((o) => !o)} aria-expanded={userMenu} aria-haspopup="menu" className="flex items-center gap-2 rounded-lg pl-1 pr-2 h-9 hover:bg-slate-100 cursor-pointer">
              <Avatar name={currentUser?.name || 'User'} className="bg-brand-soft text-brand" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" aria-hidden="true" />
            </button>
            {userMenu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-30">
                <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{currentUser?.name || 'Signed in'}</p>
                  {currentUser?.role && <p className="text-[13px] text-slate-500 truncate">{currentUser.role}</p>}
                </div>
                <button role="menuitem" type="button" onClick={() => { setUserMenu(false); go('settings'); }} className="w-full flex items-center gap-2.5 px-3.5 h-9 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <SettingsIcon className="w-4 h-4 text-slate-400" /> Settings
                </button>
                <button role="menuitem" type="button" onClick={onLogout} className="w-full flex items-center gap-2.5 px-3.5 h-9 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <LogOut className="w-4 h-4 text-slate-400" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {health === 'offline' && (
          <div role="status" className="no-print bg-red-50 border-b border-red-200 px-6 py-2.5 text-sm text-red-800">
            The screening model is offline. Photos cannot be analysed until the model server is running again.
          </div>
        )}

        <main id="portal-main" className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1280px] mx-auto">{screen}</div>
        </main>
      </div>
    </div>
  );
};
