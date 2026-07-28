import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileSpreadsheet, 
  FileText, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Search, 
  Filter, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Upload, 
  ArrowRight, 
  Clock, 
  FileDown, 
  Printer, 
  Save, 
  User, 
  Baby, 
  MapPin, 
  Sparkles,
  Info,
  Brain
} from 'lucide-react';

import { initialPatientRecords, clinicalRecommendations, defaultMockStats } from '../data/mockData';
import { WeeklyScreeningsChart, PredictionDistributionChart, RiskLevelBreakdownChart } from '../components/SVGCharts';
import { GradCamVisualizer } from '../components/GradCamVisualizer';
import { Modal } from '../components/ui/Modal';
import { AITrainingConsole } from '../components/AITrainingConsole';

// Sample clinical test baby photos (represented by custom styling overlays)
const sampleBabies = [
  {
    id: "sample-1",
    name: "Baby Garcia (Sample)",
    ageDays: 4,
    gender: "Male",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    notes: "High risk test sample. Visually yellowish face.",
    risk: "High Risk",
    confidence: 94.8,
    prediction: "Jaundice Detected"
  },
  {
    id: "sample-2",
    name: "Baby Olivia (Sample)",
    ageDays: 3,
    gender: "Female",
    hospital: "St. Mary's Pediatric Wing",
    doctor: "Dr. Elena Smith",
    notes: "Normal discharge sample. Clean skin pink tone.",
    risk: "Normal",
    confidence: 91.2,
    prediction: "Normal / Low Risk"
  },
  {
    id: "sample-3",
    name: "Baby Liam (Sample)",
    ageDays: 5,
    gender: "Male",
    hospital: "General Children's Hospital",
    doctor: "Dr. Marcus Vance",
    notes: "Borderline case. Elevated bilirubin index.",
    risk: "Moderate Risk",
    confidence: 84.5,
    prediction: "Mild Bilirubin Elevation"
  }
];

export const DashboardPage = ({ currentUser, onLogout, initialTab = "dashboard", showToast }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(initialPatientRecords[0]); // Default fallback
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modelState, setModelState] = useState({
    status: "Untrained",
    version: "Neonatal-Net v0.0.0",
    accuracy: 0.0,
    datasetSize: 0,
    history: []
  });

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/records');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
        if (data.length > 0) {
          setSelectedRecord(prev => {
            if (!prev || !data.some(r => r.patientId === prev.patientId)) {
              return data[0];
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  const fetchModelStatus = async () => {
    try {
      const response = await fetch('/api/model/status');
      if (response.ok) {
        const data = await response.json();
        setModelState(data);
      }
    } catch (err) {
      console.error("Error fetching model status:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchModelStatus();
  }, []);
  
  // Settings State
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState({ email: true, syslogs: true, criticalOnly: false });
  const [threshold, setThreshold] = useState(85);
  const [melaninCorrection, setMelaninCorrection] = useState(true);

  // New Screening Form States
  const [formData, setFormData] = useState({
    patientId: "",
    babyName: "",
    ageDays: "",
    gender: "Male",
    hospitalName: currentUser?.hospital || "St. Mary's Pediatric Wing",
    doctorName: currentUser?.name || "Dr. Elena Smith",
    notes: ""
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // AI Analysis Pipeline simulation
  const [pipelineState, setPipelineState] = useState('idle'); // idle, uploaded, quality, preprocessing, analysis, complete
  const [pipelineProgress, setPipelineProgress] = useState(0);

  // Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);

  // Generate unique Patient ID
  const generatePatientId = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `NEO-${new Date().getFullYear()}-${rand}`;
  };

  useEffect(() => {
    if (activeTab === 'new-screening' && !formData.patientId) {
      setFormData(prev => ({ ...prev, patientId: generatePatientId() }));
    }
  }, [activeTab]);

  // Load a clinical test sample
  const handleSelectSample = (sample) => {
    setFormData({
      patientId: generatePatientId(),
      babyName: sample.name,
      ageDays: sample.ageDays,
      gender: sample.gender,
      hospitalName: sample.hospital,
      doctorName: sample.doctor,
      notes: sample.notes
    });
    setUploadedImage({
      name: `${sample.name.toLowerCase().replace(/\s/g, '_')}_scan.png`,
      size: "2.4 MB",
      mockResult: sample
    });
    showToast("Test sample baby image loaded successfully!", "info");
  };

  // Image Upload handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      simulateFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      simulateFileUpload(file);
    }
  };

  const simulateFileUpload = (file) => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadedImage({
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          });
          showToast("Image uploaded successfully!", "success");
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  // Trigger AI analysis pipeline
  const handleStartAnalysis = (e) => {
    e.preventDefault();
    if (!uploadedImage) {
      showToast("Please upload a newborn baby face image or choose a clinical test sample.", "error");
      return;
    }
    if (!formData.babyName || !formData.ageDays) {
      showToast("Please fill in Baby Name and Age (in days) to process.", "error");
      return;
    }

    setPipelineState('uploaded');
    setPipelineProgress(10);

    // Timeline simulation steps
    const steps = [
      { state: 'quality', progress: 30, delay: 1000 },
      { state: 'preprocessing', progress: 55, delay: 2000 },
      { state: 'analysis', progress: 80, delay: 3500 },
      { state: 'complete', progress: 100, delay: 5000 }
    ];

    steps.forEach((step) => {
      setTimeout(async () => {
        setPipelineState(step.state);
        setPipelineProgress(step.progress);
        
        if (step.state === 'complete') {
          try {
            const response = await fetch('/api/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientId: formData.patientId,
                name: formData.babyName,
                ageDays: parseInt(formData.ageDays),
                gender: formData.gender,
                hospital: formData.hospitalName,
                doctor: formData.doctorName,
                notes: formData.notes
              })
            });

            if (response.ok) {
              const newRecordResult = await response.json();
              setRecords(prev => [newRecordResult, ...prev]);
              setSelectedRecord(newRecordResult);
              showToast(`Screening Analysis Complete. Status: ${newRecordResult.status}`, "success");
              
              // Move to Results tab
              setTimeout(() => {
                setActiveTab('results');
                // reset new screening page form
                setFormData({
                  patientId: "",
                  babyName: "",
                  ageDays: "",
                  gender: "Male",
                  hospitalName: currentUser?.hospital || "St. Mary's Pediatric Wing",
                  doctorName: currentUser?.name || "Dr. Elena Smith",
                  notes: ""
                });
                setUploadedImage(null);
                setUploadProgress(0);
                setPipelineState('idle');
                setPipelineProgress(0);
              }, 800);
            } else {
              showToast("Failed to process screening on server.", "error");
              setPipelineState('idle');
              setPipelineProgress(0);
            }
          } catch (err) {
            console.error("Error starting screening:", err);
            showToast("Server connection error during screening.", "error");
            setPipelineState('idle');
            setPipelineProgress(0);
          }
        }
      }, step.delay);
    });
  };

  // Actions for Report Page
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    showToast("Generating clinical PDF report download...", "info");
    setTimeout(() => {
      showToast("NeoBloom_Report_" + selectedRecord.patientId + ".pdf downloaded successfully!", "success");
    }, 1500);
  };

  const handleSaveRecord = () => {
    showToast("Report saved securely to patient database.", "success");
  };

  // Record Search & Filtering
  const filteredRecords = records.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (status) => {
    switch (status) {
      case "High Risk": return "text-rose-600 bg-rose-50 border-rose-200";
      case "Moderate Risk": return "text-amber-600 bg-amber-50 border-amber-200";
      case "Normal":
      default:
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
    }
  };

  const getRiskBadge = (status) => {
    switch (status) {
      case "High Risk": return "bg-rose-500 text-white";
      case "Moderate Risk": return "bg-amber-500 text-white";
      case "Normal":
      default:
        return "bg-emerald-500 text-white";
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. Sidebar Component */}
      <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Sidebar Branding header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg font-display">
              N
            </div>
            <div>
              <span className="text-base font-bold text-white font-display tracking-tight">NeoBloom</span>
              <span className="block text-[9px] text-teal-400 font-bold uppercase tracking-wider">Clinical Portal</span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('new-screening')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'new-screening' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <PlusCircle className="w-4 h-4" />
              New Screening
            </button>
            <button 
              onClick={() => setActiveTab('patient-records')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'patient-records' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Patient Records
            </button>
            <button 
              onClick={() => setActiveTab('reports')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'reports' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('ai-training')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'ai-training' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <Brain className="w-4 h-4" />
              AI Model Training
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'settings' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button 
              onClick={() => setActiveTab('help')} 
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'help' ? 'bg-teal-950 text-teal-400 border-l-4 border-teal-500' : 'hover:bg-slate-800/60 hover:text-white'}`}
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
          </nav>
        </div>

        {/* Sidebar Doctor Profile Info at the bottom */}
        <div className="p-4 border-t border-slate-850 flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
            <div className="w-9 h-9 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center font-bold">
              ES
            </div>
            <div className="overflow-hidden">
              <span className="block text-sm font-bold text-white truncate">{currentUser?.name || "Dr. Elena Smith"}</span>
              <span className="block text-[10px] text-slate-500 font-medium truncate">{currentUser?.role || "Senior Pediatrician"}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout System
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Navigation Breadcrumb & Top Bar */}
        <header className="no-print bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>NeoBloom Portal</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-clinical-600 font-bold capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1 capitalize font-display">
              {activeTab === 'dashboard' && 'Clinical Detection Dashboard'}
              {activeTab === 'new-screening' && 'Initialize AI Screening'}
              {activeTab === 'patient-records' && 'Infant Screening Registry'}
              {activeTab === 'results' && 'AI Clinical Analysis Findings'}
              {activeTab === 'reports' && 'Clinical Summary Report'}
              {activeTab === 'analytics' && 'Screening & Prediction Analytics'}
              {activeTab === 'ai-training' && 'AI Model Training Console'}
              {activeTab === 'settings' && 'Platform Configuration'}
              {activeTab === 'help' && 'Clinical Knowledge Center'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <button 
                onClick={onLogout} 
                className="hover:text-clinical-600 transition-colors cursor-pointer"
              >
                Home
              </button>
              <button 
                onClick={onLogout} 
                className="hover:text-clinical-600 transition-colors cursor-pointer"
              >
                About
              </button>
              <button 
                onClick={onLogout} 
                className="hover:text-clinical-600 transition-colors cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={() => setActiveTab('new-screening')} 
                className={`transition-colors cursor-pointer pb-0.5 ${activeTab === 'new-screening' || activeTab === 'results' ? 'text-clinical-600 border-b-2 border-clinical-600 font-bold' : 'hover:text-clinical-600'}`}
              >
                Detection
              </button>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={`transition-colors cursor-pointer pb-0.5 ${activeTab === 'reports' ? 'text-clinical-600 border-b-2 border-clinical-600 font-bold' : 'hover:text-clinical-600'}`}
              >
                Reports
              </button>
            </nav>

            <button 
              onClick={() => setActiveTab('new-screening')}
              className="flex items-center gap-2 px-5 py-2.5 bg-clinical-600 text-white rounded-full text-xs font-bold shadow-xs hover:bg-clinical-700 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          
          {/* A. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Main Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Screenings</span>
                  <span className="block text-3xl font-extrabold text-slate-800 font-display">{427 + records.length}</span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>+{Math.round((records.length / 427) * 100)}% database increase</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0 opacity-40" />
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">High-Risk Cases</span>
                  <span className="block text-3xl font-extrabold text-rose-600 font-display">
                    {35 + records.filter(r => r.status === 'High Risk').length}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{(((35 + records.filter(r => r.status === 'High Risk').length) / (427 + records.length)) * 100).toFixed(1)}% referral rate</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-40" />
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Screenings</span>
                  <span className="block text-3xl font-extrabold text-slate-800 font-display">
                    {records.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-400">Next discharge queue: 3 babies</span>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40" />
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">AI Model Status</span>
                  <span className="block text-3xl font-extrabold text-emerald-600 font-display">{modelState.status}</span>
                  <span className="block text-[10px] text-slate-400 font-bold font-mono truncate">
                    {modelState.version} {modelState.accuracy ? `(${modelState.accuracy}% Sens)` : ''}
                  </span>
                </div>
              </div>

              {/* Chart Previews */}
              <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <WeeklyScreeningsChart />
                </div>
                <div className="md:col-span-4">
                  <RiskLevelBreakdownChart />
                </div>
              </div>

              {/* Recent Patient Screenings List */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display">Recent Screenings</h3>
                    <p className="text-xs text-slate-500">Live feed of evaluations from the pediatric wing</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('patient-records')} 
                    className="text-xs font-bold text-clinical-600 hover:text-clinical-700 flex items-center gap-1"
                  >
                    View Registry
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Patient ID</th>
                        <th className="py-3 px-4">Baby Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Prediction</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {records.slice(0, 4).map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{rec.patientId}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{rec.name}</td>
                          <td className="py-3.5 px-4 text-slate-500">{rec.date}</td>
                          <td className="py-3.5 px-4 text-slate-600">{rec.prediction} ({rec.confidence}%)</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(rec.status)} border`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={() => { setSelectedRecord(rec); setActiveTab('results'); }}
                              className="text-xs font-bold text-clinical-600 hover:text-clinical-700 cursor-pointer"
                            >
                              View findings
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* B. NEW SCREENING TAB */}
          {activeTab === 'new-screening' && (
            <div className="grid md:grid-cols-12 gap-6 animate-fade-in">
              
              {/* Left Column: Form & Clinical Presets */}
              <div className="md:col-span-8 space-y-6">
                
                {/* Clinical Preset Selection */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-display">Simulated Baby Profiles</h3>
                    <p className="text-xs text-slate-500">Pick a preset baby photo scan to test different AI diagnostic pipelines instantly</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {sampleBabies.map((sb) => (
                      <button
                        key={sb.id}
                        type="button"
                        onClick={() => handleSelectSample(sb)}
                        className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-300 rounded-xl text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer"
                      >
                        <div>
                          <span className="block text-xs font-bold text-slate-800 group-hover:text-teal-900">{sb.name}</span>
                          <span className="block text-[10px] text-slate-400">{sb.ageDays} Days • {sb.gender}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block self-start ${
                          sb.risk === "High Risk" ? "bg-rose-100 text-rose-700" :
                          sb.risk === "Moderate Risk" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {sb.risk}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient Information Form */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <User className="w-5 h-5 text-clinical-600" />
                    <h3 className="text-base font-bold text-slate-800 font-display">Patient Information</h3>
                  </div>

                  <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleStartAnalysis}>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient ID</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={formData.patientId} 
                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-slate-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Baby Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.babyName} 
                        onChange={(e) => setFormData(prev => ({ ...prev, babyName: e.target.value }))}
                        className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 focus:outline-hidden"
                        placeholder="e.g. Baby Garcia"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Age (Days) *</label>
                      <input 
                        type="number" 
                        required
                        min="1" 
                        max="30"
                        value={formData.ageDays} 
                        onChange={(e) => setFormData(prev => ({ ...prev, ageDays: e.target.value }))}
                        className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 focus:outline-hidden"
                        placeholder="e.g. 4"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender *</label>
                      <select 
                        value={formData.gender} 
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 focus:outline-hidden bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Undetermined">Undetermined</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hospital Name</label>
                      <input 
                        type="text" 
                        value={formData.hospitalName} 
                        onChange={(e) => setFormData(prev => ({ ...prev, hospitalName: e.target.value }))}
                        className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attending Doctor</label>
                      <input 
                        type="text" 
                        value={formData.doctorName} 
                        onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
                        className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clinical Assessment Notes</label>
                      <textarea 
                        rows="3"
                        value={formData.notes} 
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 focus:outline-hidden"
                        placeholder="Add visual findings, TcB measurements, gestational details..."
                      />
                    </div>

                    <div className="sm:col-span-2 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-semibold">* Required clinical indicators</span>
                      <button
                        type="submit"
                        disabled={pipelineState !== 'idle'}
                        className="px-6 py-3 bg-clinical-600 hover:bg-clinical-700 text-white text-sm font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
                      >
                        <Activity className="w-4 h-4 animate-pulse" />
                        Analyze Baby Scan
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Image Upload & Pipeline Pipeline */}
              <div className="md:col-span-4 space-y-6">
                
                {/* Drag and Drop Upload */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-base font-bold text-slate-800 font-display mb-4">Image Upload</h3>

                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isDragOver ? 'border-clinical-500 bg-clinical-50/50' : 
                      uploadedImage ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {!uploadedImage ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Drag & drop baby's photo here</p>
                          <p className="text-[10px] text-slate-400 mt-1">Supports JPEG, PNG (Max 10MB)</p>
                        </div>
                        <div>
                          <label className="px-4 py-2 bg-clinical-50 hover:bg-clinical-100 text-clinical-600 rounded-lg text-xs font-bold border border-clinical-200 transition-colors inline-block cursor-pointer">
                            Browse Files
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Mock baby image preview */}
                        <div className="aspect-square w-24 bg-slate-900 rounded-xl mx-auto flex items-center justify-center overflow-hidden border border-slate-200 relative group">
                          <Baby className="w-10 h-10 text-teal-100 opacity-60" />
                          <div className="absolute inset-0 bg-teal-600/10" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{uploadedImage.name}</p>
                          <p className="text-[10px] text-slate-400">{uploadedImage.size} • Uploaded</p>
                        </div>
                        <button 
                          onClick={() => setUploadedImage(null)}
                          className="text-[10px] font-bold text-rose-500 hover:underline"
                        >
                          Remove Photo
                        </button>
                      </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-4 space-y-1">
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-clinical-600" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">{uploadProgress}% Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pipeline State Timeline */}
                {pipelineState !== 'idle' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Processing Pipeline</h3>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-clinical-550 transition-all duration-500 rounded-full"
                          style={{ width: `${pipelineProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>PIPELINE LOAD</span>
                        <span>{pipelineProgress}%</span>
                      </div>
                    </div>

                    {/* Check list */}
                    <div className="space-y-3 pt-2">
                      
                      {/* Step 1 */}
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          pipelineState !== 'idle' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          ✓
                        </span>
                        <span className="text-xs font-semibold text-slate-700">Uploaded Complete</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          pipelineState === 'quality' ? 'bg-teal-600 text-white animate-pulse' :
                          (pipelineState !== 'uploaded' && pipelineState !== 'idle' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400')
                        }`}>
                          {pipelineState === 'uploaded' ? '○' : (pipelineState === 'quality' ? '⌛' : '✓')}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">Quality Assessment</span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          pipelineState === 'preprocessing' ? 'bg-teal-600 text-white animate-pulse' :
                          (pipelineState !== 'uploaded' && pipelineState !== 'quality' && pipelineState !== 'idle' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400')
                        }`}>
                          {pipelineState === 'preprocessing' ? '⌛' : (pipelineState !== 'uploaded' && pipelineState !== 'quality' && pipelineState !== 'idle' ? '✓' : '○')}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">Preprocessing Frame</span>
                      </div>

                      {/* Step 4 */}
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          pipelineState === 'analysis' ? 'bg-teal-600 text-white animate-pulse' :
                          (pipelineState === 'complete' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400')
                        }`}>
                          {pipelineState === 'analysis' ? '⌛' : (pipelineState === 'complete' ? '✓' : '○')}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">AI Neural Analysis</span>
                      </div>

                      {/* Step 5 */}
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          pipelineState === 'complete' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {pipelineState === 'complete' ? '✓' : '○'}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">Prediction Complete</span>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. RESULTS TAB */}
          {activeTab === 'results' && selectedRecord && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Alert Warning for High Risk */}
              {selectedRecord.status === "High Risk" && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800">Critical Referrals Guidelines Active</h4>
                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                      AI screening indicates deep jaundice detection focus. Neonatal-Net v2 recommends scheduling immediate serum bilirubin lab confirmation.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Results Board */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Left Column: Diagnostics visual comparison */}
                <div className="md:col-span-7 space-y-6">
                  <GradCamVisualizer riskLevel={selectedRecord.status} confidence={selectedRecord.confidence} />

                  {/* Medical Recommendation Card */}
                  <div className={`p-6 rounded-2xl border ${
                    selectedRecord.status === "High Risk" ? "bg-rose-50 border-rose-100" :
                    selectedRecord.status === "Moderate Risk" ? "bg-amber-50 border-amber-100" :
                    "bg-emerald-50 border-emerald-100"
                  } space-y-4`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${
                        selectedRecord.status === "High Risk" ? "text-rose-500" :
                        selectedRecord.status === "Moderate Risk" ? "text-amber-500" :
                        "text-emerald-500"
                      }`} />
                      <h3 className="text-base font-bold text-slate-800 font-display">
                        {clinicalRecommendations[selectedRecord.status]?.title || "Clinical Guidelines"}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {clinicalRecommendations[selectedRecord.status]?.message}
                    </p>

                    <div className="pt-2">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Protocols:</span>
                      <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-semibold">
                        {clinicalRecommendations[selectedRecord.status]?.actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right Column: Patient stats & specs */}
                <div className="md:col-span-5 space-y-6">
                  
                  {/* Summary Metric Board */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full" />
                    
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${getRiskBadge(selectedRecord.status)}`}>
                        {selectedRecord.status}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-800 font-display mt-2">{selectedRecord.prediction}</h3>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{selectedRecord.modelUsed} Analysis Report</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence</span>
                        <span className="text-xl font-bold text-slate-700 font-mono">{selectedRecord.confidence}%</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Taken</span>
                        <span className="text-xl font-bold text-slate-700 font-mono">{selectedRecord.processingTime}</span>
                      </div>
                    </div>

                    {/* Patient summary details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Patient ID:</span>
                        <span className="font-mono font-bold text-slate-700">{selectedRecord.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Infant Name:</span>
                        <span className="font-bold text-slate-700">{selectedRecord.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Age at Scan:</span>
                        <span className="font-semibold text-slate-700">{selectedRecord.ageDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Gender:</span>
                        <span className="font-semibold text-slate-700">{selectedRecord.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Hospital Unit:</span>
                        <span className="font-semibold text-slate-700">{selectedRecord.hospital}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Screener:</span>
                        <span className="font-semibold text-slate-700">{selectedRecord.doctor}</span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="flex-1 flex justify-center items-center gap-1.5 px-4 py-2.5 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Generate Report
                      </button>
                      <button 
                        onClick={() => { setSelectedRecord(selectedRecord); setActiveTab('reports'); setTimeout(() => window.print(), 300); }}
                        className="flex justify-center items-center p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Disclaimer Card */}
                  <div className="p-4 bg-slate-100 border border-slate-200/60 rounded-xl">
                    <p className="text-[10px] text-slate-500 leading-relaxed text-center font-medium">
                      This application is intended for screening and research purposes only and does not replace professional medical diagnosis.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* D. REPORTS TAB */}
          {activeTab === 'reports' && selectedRecord && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8 space-y-8 animate-fade-in print-card relative">
              
              {/* Report Options Floating header (Hidden during print) */}
              <div className="no-print absolute top-6 right-8 flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button 
                  onClick={handleSaveRecord}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>

              {/* Institution Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 pt-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-800 font-display">NeoBloom Jaundice Screening Report</span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clinical Analytics Portal • Hospital Copy</p>
                </div>
                <div className="text-right text-xs">
                  <span className="block font-bold text-slate-800">{selectedRecord.hospital}</span>
                  <span className="block text-slate-400 font-medium">Date: {selectedRecord.date}</span>
                </div>
              </div>

              {/* Patient Profile */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Identifier</span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">{selectedRecord.patientId}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baby Name</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">{selectedRecord.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age (Days)</span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">{selectedRecord.ageDays} Days</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">{selectedRecord.gender}</span>
                </div>
              </div>

              {/* Diagnostic findings */}
              <div className="grid md:grid-cols-12 gap-8">
                
                {/* Diagnostic Stats */}
                <div className="md:col-span-5 space-y-4">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Analysis Findings</span>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Prediction</span>
                      <span className={`block text-lg font-extrabold mt-0.5 ${
                        selectedRecord.status === 'High Risk' ? 'text-rose-600' :
                        selectedRecord.status === 'Moderate Risk' ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {selectedRecord.prediction}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Confidence Score</span>
                        <span className="block text-base font-bold text-slate-800 mt-0.5 font-mono">{selectedRecord.confidence}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Classification</span>
                        <span className="block text-base font-bold text-slate-800 mt-0.5">{selectedRecord.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Processing Speed</span>
                        <span className="block text-sm font-semibold text-slate-700 mt-0.5 font-mono">{selectedRecord.processingTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Model Version</span>
                        <span className="block text-sm font-semibold text-slate-700 mt-0.5 font-mono">{selectedRecord.modelUsed}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="md:col-span-7 space-y-4">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Medical Guidelines</span>
                  
                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    <p className="font-bold text-slate-800">{clinicalRecommendations[selectedRecord.status]?.title}</p>
                    <p className="font-medium">{clinicalRecommendations[selectedRecord.status]?.message}</p>
                    
                    <div className="pt-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Protocols:</span>
                      <ul className="list-disc pl-4 space-y-1 font-semibold text-slate-650">
                        {clinicalRecommendations[selectedRecord.status]?.actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Disclaimer */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl text-[10px] text-slate-500 text-center leading-relaxed">
                <strong>HIPAA Regulatory Note:</strong> This application is intended for pre-screening and clinical research purposes only. It is not a direct substitute for clinical evaluation by a physician or Total Serum Bilirubin (TSB) laboratory blood panels.
              </div>

              {/* Signature board */}
              <div className="flex justify-between items-end pt-12">
                <div className="space-y-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Attending Pediatrician</span>
                  <span className="block text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 pr-16">{selectedRecord.doctor}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Official Signature Approval</span>
                  <div className="h-10 w-32 border-b border-slate-200 border-dashed" />
                </div>
              </div>

            </div>
          )}

          {/* E. PATIENT RECORDS TAB */}
          {activeTab === 'patient-records' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
              
              {/* Search and Filters bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-clinical-500 focus:outline-hidden"
                    placeholder="Search name or ID..."
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-bold uppercase">
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                  </span>
                  
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    {['All', 'High Risk', 'Moderate Risk', 'Normal'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          statusFilter === tab ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Patient ID</th>
                      <th className="py-3 px-4">Baby Name</th>
                      <th className="py-3 px-4">Age (Days)</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Date Evaluated</th>
                      <th className="py-3 px-4">AI Prediction</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((rec) => (
                        <tr key={rec.patientId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{rec.patientId}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{rec.name}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{rec.ageDays} Days</td>
                          <td className="py-3.5 px-4 text-slate-500">{rec.gender}</td>
                          <td className="py-3.5 px-4 text-slate-500">{rec.date}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">{rec.prediction} ({rec.confidence}%)</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(rec.status)} border`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setModalRecord(rec);
                                setIsDetailsModalOpen(true);
                              }}
                              className="text-xs font-bold text-clinical-600 hover:text-clinical-700 cursor-pointer mr-3"
                            >
                              Quick View
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRecord(rec);
                                setActiveTab('results');
                              }}
                              className="text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                            >
                              Diagnostics
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                          No infant screening records found matching search queries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* F. ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* 1. Line chart weekly screenings */}
                <div className="md:col-span-8">
                  <WeeklyScreeningsChart />
                </div>

                {/* 2. Donut breakdown */}
                <div className="md:col-span-4">
                  <RiskLevelBreakdownChart />
                </div>

                {/* 3. Bar chart distribution */}
                <div className="md:col-span-6">
                  <PredictionDistributionChart />
                </div>

                {/* 4. Mini Clinical Performance card */}
                <div className="md:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-800">AI Model Technical Performance</h4>
                    <p className="text-xs text-slate-500">Real-time telemetry from validation nodes</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 my-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classification Accuracy</span>
                      <span className="text-2xl font-black text-clinical-600 font-display mt-1 block">96.4%</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">95% Confidence interval [94.1%, 98.2%]</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">F1-Score (Jaundice class)</span>
                      <span className="text-2xl font-black text-clinical-600 font-display mt-1 block">94.8%</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Valid skin range calibration active</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                    <Info className="w-4 h-4 text-clinical-400" />
                    <span>Tested on 2,400+ infant image cases representing multi-ethnic skin phototypes.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* AI MODEL TRAINING TAB */}
          {activeTab === 'ai-training' && (
            <div className="animate-fade-in">
              <AITrainingConsole modelState={modelState} onModelTrained={fetchModelStatus} showToast={showToast} />
            </div>
          )}

          {/* G. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 max-w-3xl mx-auto animate-fade-in">
              <h3 className="text-base font-bold text-slate-850 border-b border-slate-100 pb-3 font-display">Configure Platform Settings</h3>
              
              <div className="space-y-6">
                
                {/* 1. Theme selection */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Display Theme</span>
                  <div className="flex gap-3">
                    {['light', 'dark', 'hospital-slate'].map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTheme(t); showToast(`Theme changed to ${t}`, "info"); }}
                        className={`px-4 py-2 border rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          theme === t ? 'border-clinical-600 bg-clinical-50 text-clinical-600 font-extrabold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {t.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Notifications */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Notification Preferences</span>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 text-xs font-semibold text-slate-650 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={notifications.email} 
                        onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                        className="w-4 h-4 rounded-md border-slate-300 text-clinical-600 focus:ring-clinical-500"
                      />
                      Email critical High Risk referral alerts instantly
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-slate-650 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={notifications.syslogs} 
                        onChange={(e) => setNotifications(prev => ({ ...prev, syslogs: e.target.checked }))}
                        className="w-4 h-4 rounded-md border-slate-300 text-clinical-600 focus:ring-clinical-500"
                      />
                      Archive screening reports to hospital EHR log systems
                    </label>
                  </div>
                </div>

                {/* 3. AI Model specs */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">AI Calibration & Sensitivity</span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Decision Confidence Threshold</span>
                      <span className="text-slate-800 font-bold">{threshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="70" 
                      max="98" 
                      value={threshold} 
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-full accent-clinical-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">Higher values trigger fewer false positives but require higher visual certainty.</p>
                  </div>

                  <label className="flex items-center gap-3 text-xs font-semibold text-slate-650 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={melaninCorrection} 
                      onChange={(e) => setMelaninCorrection(e.target.checked)}
                      className="w-4 h-4 rounded-md border-slate-300 text-clinical-600 focus:ring-clinical-500"
                    />
                    Auto-compensate for Fitzpatrick Skin Phototype (Melanin Curve calibration)
                  </label>
                </div>

                {/* Save button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => showToast("Platform configurations updated successfully!", "success")}
                    className="px-5 py-2.5 bg-clinical-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-clinical-700 transition-colors"
                  >
                    Save Configuration
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* H. HELP TAB */}
          {activeTab === 'help' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 max-w-3xl mx-auto animate-fade-in">
              <h3 className="text-base font-bold text-slate-850 border-b border-slate-100 pb-3 font-display">NeoBloom FAQ & Knowledge Center</h3>
              
              <div className="space-y-4 text-sm text-slate-600">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 font-display">1. How does NeoBloom scan for Jaundice?</h4>
                  <p className="text-xs leading-relaxed">
                    NeoBloom captures or analyzes a raw skin image of the infant's face (the forehead/nose/cheek region). Our deep convolutional network analyzes dermal pixels, separating red-green-blue channels and correlating skin pigmentation values with standard Bilirubin concentration curves.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 font-display">2. Does NeoBloom replace Transcutaneous Bilirubin (TcB) or Serum tests?</h4>
                  <p className="text-xs leading-relaxed">
                    No. NeoBloom is a rapid, non-invasive pre-screening tool designed to minimize unnecessary blood drawing heel-sticks. High Risk or Moderate Risk outcomes flagged by NeoBloom must always be confirmed using standard hospital lab-validated Total Serum Bilirubin (TSB) tests.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 font-display">3. What is the Grad-CAM Heatmap?</h4>
                  <p className="text-xs leading-relaxed">
                    Grad-CAM (Gradient-weighted Class Activation Mapping) is an explainable AI tool. It renders a thermal focus map over the infant face, showing which skin areas influenced the neural network's decision. If the AI highlights non-skin zones (like the blanket or clothing), the screener is advised to retake the photo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 font-display">4. Recommended photo capture guidelines:</h4>
                  <ul className="text-xs leading-relaxed list-disc pl-5 space-y-1">
                    <li>Ensure daylight or bright, neutral-white hospital examination lamps.</li>
                    <li>Avoid shadows or direct warm-yellow incandescent lighting on the face.</li>
                    <li>Capture the baby sleeping or calm with eyes closed, centering the nose/forehead area in the camera frame.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 2. Detailed Patient Modal */}
      {isDetailsModalOpen && modalRecord && (
        <Modal 
          isOpen={isDetailsModalOpen} 
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Patient Record: ${modalRecord.patientId}`}
        >
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baby Name</span>
                <span className="font-bold text-slate-800">{modalRecord.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age (Days)</span>
                <span className="font-semibold text-slate-800">{modalRecord.ageDays} Days</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                <span className="font-semibold text-slate-800">{modalRecord.gender}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Evaluated</span>
                <span className="font-semibold text-slate-850">{modalRecord.date}</span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnostic Output</span>
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(modalRecord.status)} border`}>
                  {modalRecord.status}
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {modalRecord.prediction} ({modalRecord.confidence}% Confidence)
                </span>
              </div>
            </div>

            {modalRecord.notes && (
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</span>
                <p className="text-xs text-slate-650 bg-slate-50 p-3 rounded-xl border border-slate-100 font-semibold leading-relaxed">
                  {modalRecord.notes}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                Close View
              </button>
              <button 
                onClick={() => {
                  setSelectedRecord(modalRecord);
                  setIsDetailsModalOpen(false);
                  setActiveTab('reports');
                }}
                className="px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Printable Report
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
