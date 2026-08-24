import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Brain, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Database, 
  Activity, 
  FileText, 
  Download, 
  ChevronRight, 
  Clock, 
  Sparkles,
  RefreshCw,
  Gauge
} from 'lucide-react';

export const AITrainingConsole = ({ modelState, onModelTrained, showToast }) => {
  const [datasetStats, setDatasetStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  
  // Real-time chart values during training
  const [liveLoss, setLiveLoss] = useState([]);
  const [liveAcc, setLiveAcc] = useState([]);
  
  const terminalEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch dataset details on load
  const fetchDatasetDetails = async () => {
    try {
      const res = await fetch('/api/dataset');
      if (res.ok) {
        const data = await res.json();
        setDatasetStats(data);
      }
    } catch (err) {
      console.error("Error loading dataset:", err);
    }
  };

  useEffect(() => {
    fetchDatasetDetails();
  }, []);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [trainingLogs]);

  // File Upload Handlers
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
    if (file) handleUploadFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleUploadFile(file);
  };

  const handleUploadFile = async (file) => {
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.csv') && !filename.endsWith('.json')) {
      showToast("Only CSV and JSON dataset files are supported.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('dataset', file);

    try {
      const res = await fetch('/api/dataset/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Dataset loaded successfully! Loaded ${data.size} items.`, "success");
        fetchDatasetDetails();
        // Clear old logs
        setTrainingLogs([
          `nova-ai-terminal$ import dataset --file=${file.name}`,
          `[INFO] Parsing ${filename.endsWith('.csv') ? 'CSV tabular data' : 'JSON records'}...`,
          `[SUCCESS] Dataset initialized. Row count: ${data.size} records ready.`
        ]);
        setLiveLoss([]);
        setLiveAcc([]);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to parse dataset.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error uploading dataset.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Download Sample Dataset
  const handleDownloadSample = () => {
    window.open('/api/dataset/sample', '_blank');
    showToast("Sample clinical training dataset download started.", "success");
  };

  // Run AI Model Training
  const handleStartTraining = async () => {
    if (!datasetStats || !datasetStats.uploaded) {
      showToast("Please upload a clinical dataset first.", "warning");
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setLiveLoss([]);
    setLiveAcc([]);
    setTrainingLogs([
      "nova-ai-terminal$ node train.js --dataset=active_db --epochs=10",
      "[INFO] Loading system environment & CUDA bindings...",
      "[INFO] Executing Neonatal-Net Jaundice Text Tokenizer..."
    ]);

    try {
      const res = await fetch('/api/model/train', {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "Training start rejected.", "error");
        setIsTraining(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const rawData = line.slice(6).trim();
              if (!rawData) continue;
              const data = JSON.parse(rawData);
              
              setTrainingLogs(prev => [...prev, data.message]);
              if (data.percent !== undefined) {
                setTrainingProgress(data.percent);
              }
              
              // Log loss/accuracy for visual graph
              if (data.loss !== undefined && data.accuracy !== undefined) {
                setLiveLoss(prev => [...prev, data.loss]);
                setLiveAcc(prev => [...prev, data.accuracy]);
              }
              
              if (data.complete) {
                showToast(`Model successfully retrained: ${data.modelState.version}`, "success");
                onModelTrained(); // Notify parent of version change
              }
            } catch (e) {
              console.error("Error parsing event stream line:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setTrainingLogs(prev => [...prev, `[FATAL ERROR] Connection lost during training: ${err.message}`]);
      showToast("Training session disconnected.", "error");
    } finally {
      setIsTraining(false);
    }
  };

  // Calculate stats for bars
  const totalItems = datasetStats?.size || 0;
  const highRiskPercent = totalItems ? Math.round((datasetStats.stats.highRisk / totalItems) * 100) : 0;
  const modRiskPercent = totalItems ? Math.round((datasetStats.stats.moderateRisk / totalItems) * 100) : 0;
  const normalPercent = totalItems ? Math.round((datasetStats.stats.normal / totalItems) * 100) : 0;

  // Custom weights array from model state
  const featureWeights = Object.entries(modelState.weights || {})
    .map(([word, weight]) => ({ word, weight }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 10); // Display top 10 impactful words

  return (
    <div className="space-y-6">
      
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Dataset Size</span>
            <span className="text-xl font-extrabold text-slate-800 font-display">{totalItems ? `${totalItems} Records` : "No Active Dataset"}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Model Version</span>
            <span className="text-xl font-extrabold text-slate-800 font-display">{modelState.version || "N/A"}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Trained Sensitivity</span>
            <span className="text-xl font-extrabold text-indigo-600 font-display">{modelState.accuracy ? `${modelState.accuracy}%` : "Not Trained"}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Model Status</span>
            <span className={`text-xl font-extrabold font-display ${modelState.status === 'Trained' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {modelState.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Column: File Upload & Dataset Preview */}
        <div className="md:col-span-6 space-y-6 flex flex-col">
          
          {/* Uploader Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Clinical Dataset Import</h3>
              <p className="text-xs text-slate-500">Upload CSV or JSON files matching infant skin diagnosis schema to train the AI model.</p>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".csv,.json"
              />
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-full ${isDragOver ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'} transition-colors`}>
                  <Upload className="w-6 h-6" />
                </div>
                {isUploading ? (
                  <div className="space-y-1">
                    <span className="block text-sm font-bold text-slate-700 animate-pulse">Uploading and Parsing File...</span>
                    <span className="block text-xs text-slate-400">Analyzing schema & columns</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="block text-sm font-bold text-slate-700">Drag & Drop Dataset File</span>
                    <span className="block text-xs text-slate-400">Supports .csv or .json files up to 10MB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Need template dataset?</span>
                  <span className="block text-[10px] text-slate-400">150 clinical records package</span>
                </div>
              </div>
              <button 
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 rounded-lg text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Get CSV Template
              </button>
            </div>
          </div>

          {/* Dataset Explorer & Stats */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex-1 space-y-4">
            <h3 className="text-base font-bold text-slate-800 font-display">Dataset Explorer</h3>
            
            {datasetStats && datasetStats.uploaded ? (
              <div className="space-y-5">
                {/* Distribution Chart */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Sample Classification Balance</span>
                    <span className="text-slate-400">{datasetStats.size} Total Samples</span>
                  </div>
                  
                  {/* Distribution Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                    <div style={{ width: `${highRiskPercent}%` }} className="bg-rose-500 h-full" />
                    <div style={{ width: `${modRiskPercent}%` }} className="bg-amber-400 h-full" />
                    <div style={{ width: `${normalPercent}%` }} className="bg-emerald-500 h-full" />
                  </div>
                  
                  {/* Legends */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 text-rose-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                      <span>High Risk: {highRiskPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block"></span>
                      <span>Mod Risk: {modRiskPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                      <span>Normal: {normalPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="block text-xs font-bold text-slate-700">Dataset Columns & Preview (First 5 Rows)</span>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="p-3">Patient ID</th>
                          <th className="p-3">Baby Name</th>
                          <th className="p-3">Age (d)</th>
                          <th className="p-3">Diagnosis</th>
                          <th className="p-3">Risk %</th>
                        </tr>
                      </thead>
                      <tbody className="font-medium text-slate-600">
                        {datasetStats.preview?.map((row, index) => (
                          <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-[10px] text-slate-800">{row.patientId}</td>
                            <td className="p-3 font-bold">{row.name}</td>
                            <td className="p-3">{row.ageDays}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold inline-block ${
                                (row.status || '').toLowerCase().includes('high') ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                (row.status || '').toLowerCase().includes('mod') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3 font-bold font-mono text-[10px]">{row.riskScore || row.confidence}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-400" />
                <div className="space-y-1">
                  <span className="block text-sm font-bold text-slate-700">No active dataset</span>
                  <p className="text-xs text-slate-400 max-w-xs">Upload your clinical data CSV above to inspect and start AI training sessions.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Training Console & History */}
        <div className="md:col-span-6 space-y-6">
          
          {/* Training Control Console */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Model Training Terminal</h3>
                <p className="text-xs text-slate-500">Initialize compilation and parameter backpropagation loop.</p>
              </div>
              <button 
                onClick={handleStartTraining}
                disabled={isTraining || !datasetStats?.uploaded}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all ${
                  isTraining || !datasetStats?.uploaded
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                    : 'bg-clinical-950 text-teal-400 hover:bg-slate-900 border border-teal-500/30 hover:shadow-lg'
                }`}
              >
                {isTraining ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                ) : (
                  <Play className="w-4 h-4 text-teal-400" />
                )}
                {isTraining ? 'Training AI Model...' : 'Train AI Model'}
              </button>
            </div>

            {/* Terminal View */}
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 h-64 overflow-y-auto border border-slate-900 shadow-inner flex flex-col">
              <div className="flex-1 space-y-1.5">
                {trainingLogs.length === 0 ? (
                  <div className="text-slate-500 italic">nova-ai-terminal$ system ready. Awaiting training execution...</div>
                ) : (
                  trainingLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={
                        log.includes('[SUCCESS]') ? 'text-emerald-400' :
                        log.includes('[INFO]') ? 'text-blue-400' :
                        log.includes('[FATAL') ? 'text-rose-400 font-bold' :
                        log.startsWith('nova') ? 'text-teal-400 font-semibold' : 'text-slate-300'
                      }
                    >
                      {log}
                    </div>
                  ))
                )}
                {isTraining && (
                  <div className="flex items-center gap-1.5 text-teal-400">
                    <span>_</span>
                    <span className="w-1.5 h-3 bg-teal-400 animate-pulse block"></span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Training Progress Bar */}
            {isTraining && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Epoch Loss Optimizer Progress</span>
                  <span>{trainingProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    style={{ width: `${trainingProgress}%` }} 
                    className="h-full bg-teal-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                  />
                </div>
              </div>
            )}
            
            {/* Visual Real-Time Training Graph */}
            {liveLoss.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <span className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Epoch Real-time Training Curves
                </span>
                
                {/* SVG Curve Plot */}
                <div className="relative h-28 w-full">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    {/* Gridlines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#e2e8f0" strokeWidth="0.2" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#e2e8f0" strokeWidth="0.2" />
                    
                    {/* Loss Line (Red) */}
                    {liveLoss.length > 1 && (
                      <path
                        d={`M ${liveLoss.map((l, i) => `${(i / (liveLoss.length - 1)) * 100} ${28 - (l * 25)}`).join(' L ')}`}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    )}
                    
                    {/* Accuracy Line (Blue) */}
                    {liveAcc.length > 1 && (
                      <path
                        d={`M ${liveAcc.map((a, i) => `${(i / (liveAcc.length - 1)) * 100} ${28 - ((a - 60) / 40) * 25}`).join(' L ')}`}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  
                  {/* Legend overlay */}
                  <div className="absolute top-1 left-2 flex gap-4 text-[9px] font-bold">
                    <span className="text-teal-600">● Validation Accuracy</span>
                    <span className="text-rose-500">● Optimization Loss</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Model Vocabulary Feature Weights Inspector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Trained Feature Weights</h3>
              <p className="text-xs text-slate-500">Inspect symptoms keywords and clinical notes parameters learned by the model.</p>
            </div>

            {featureWeights.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                
                {/* Positive (Jaundice Indicators) */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">Jaundice Warning Signs</span>
                  <div className="space-y-2">
                    {featureWeights
                      .filter(fw => fw.weight > 0)
                      .slice(0, 5)
                      .map((fw, i) => (
                        <div key={i} className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-700">"{fw.word}"</span>
                            <span className="text-rose-600 font-mono">+{fw.weight}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100">
                            <div style={{ width: `${(fw.weight / 40) * 100}%` }} className="bg-rose-500 h-full rounded-full" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Negative (Healthy Indicators) */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Healthy Skin Indicators</span>
                  <div className="space-y-2">
                    {featureWeights
                      .filter(fw => fw.weight < 0)
                      .slice(0, 5)
                      .map((fw, i) => (
                        <div key={i} className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-700">"{fw.word}"</span>
                            <span className="text-emerald-600 font-mono">{fw.weight}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100">
                            <div style={{ width: `${(Math.abs(fw.weight) / 40) * 100}%` }} className="bg-emerald-500 h-full rounded-full" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-center p-4">Awaiting model training run to display weights.</div>
            )}
          </div>

          {/* Model Training Runs History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 font-display">AI Training History</h3>
            
            {modelState.history && modelState.history.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Model Version</th>
                      <th className="p-3">Dataset size</th>
                      <th className="p-3">Final Accuracy</th>
                      <th className="p-3">Loss</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-slate-600">
                    {modelState.history.map((hist, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="p-3 text-[10px] text-slate-400 font-mono">{new Date(hist.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-700">{hist.version}</td>
                        <td className="p-3">{hist.datasetSize} items</td>
                        <td className="p-3 font-bold text-emerald-600 font-mono">{hist.accuracy}%</td>
                        <td className="p-3 font-mono text-rose-500">{hist.loss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-center p-4">No previous model compilation runs stored.</div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
