import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, AlertTriangle, Bell, BellOff } from "lucide-react";
import SvgHeatmap from "./SvgHeatmap.jsx";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import GaugeChart from './HeatMapAnalysis/GaugeChart';
import EnhancedSearchBar from "./HeatMapAnalysis/EnhancedSearchBar";
import { LoadingView, ErrorView } from "./utils/uiHelpers";
import { getIntervalOptions, fetchPredictionsByHorizon, fetchHealth, fetchBuildings, API_BASE_URL } from "./utils/api";
import StatusRibbon from './HeatMapAnalysis/StatusRibbon';

interface CrowdData {
  buildingId: string;  // Changed from number to string to match database
  buildingName: string;
  currentCount: number;
  predictedCount: number;
  timestamp: string;
  color: string;
  capacity: number;  // Made required since we have it in database
}

interface BuildingHistoryData {
  timestamp: string;
  current_count: number;
}

interface CapacityAlert {
  id: string;
  buildingId: string;  // Changed from number to string
  buildingName: string;
  currentCount: number;
  capacity: number;
  alertLevel: 'warning' | 'critical' | 'full';
  percentage: number;
  timestamp: string;
}

interface AlertSettings {
  enabled: boolean;
  warningThreshold: number; // 80%
  criticalThreshold: number; // 90%
  fullThreshold: number; // 100%
  showNotifications: boolean;
}

const CrowdManagement: React.FC = () => {
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [buildingCatalog, setBuildingCatalog] = useState<{ buildingId: string; buildingName: string; capacity: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"current" | "predicted">("current");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [buildingHistory, setBuildingHistory] = useState<BuildingHistoryData[]>([]);
  // Minimal layout; no grid/list toggle or sorting controls
  const [lastSync, setLastSync] = useState<string>('');
  
  // Capacity Alert States
  const [alerts, setAlerts] = useState<CapacityAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true,
    warningThreshold: 80,
    criticalThreshold: 90,
    fullThreshold: 100,
    showNotifications: true
  });
  
  const intervalOptions = getIntervalOptions();
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => 
    intervalOptions.includes(30) ? 30 : intervalOptions[0]
  );
  
  // Remove auto-refresh controls; data loads on demand (Refresh button)

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Get building capacity from catalog (fallback to crowd data)
  const getBuildingCapacity = useCallback((buildingId: string): number => {
    const fromCatalog = buildingCatalog.find(b => b.buildingId === buildingId)?.capacity;
    if (typeof fromCatalog === 'number') return fromCatalog;
    const fromData = crowdData.find(d => d.buildingId === buildingId)?.capacity;
    return typeof fromData === 'number' ? fromData : 100; // Default fallback
  }, [crowdData, buildingCatalog]);

  // Check for capacity alerts
  const checkCapacityAlerts = useCallback((data: CrowdData[]): CapacityAlert[] => {
    if (!alertSettings.enabled) return [];
    
    const newAlerts: CapacityAlert[] = [];
    
    data.forEach(building => {
      const capacity = building.capacity; // Use capacity directly from building data
      const percentage = Math.round((building.currentCount / capacity) * 100);
      
      let alertLevel: 'warning' | 'critical' | 'full' | null = null;
      
      if (percentage >= alertSettings.fullThreshold) {
        alertLevel = 'full';
      } else if (percentage >= alertSettings.criticalThreshold) {
        alertLevel = 'critical';
      } else if (percentage >= alertSettings.warningThreshold) {
        alertLevel = 'warning';
      }
      
      if (alertLevel) {
        newAlerts.push({
          id: `${building.buildingId}-${Date.now()}`,
          buildingId: building.buildingId,
          buildingName: building.buildingName,
          currentCount: building.currentCount,
          capacity,
          alertLevel,
          percentage,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
    
    return newAlerts;
  }, [alertSettings]);

  // Building history fetching from old server is removed for now.

  interface PredictionRecord {
    building_id?: string; buildingId?: string;
    building_name?: string; buildingName?: string;
    horizon_min?: number;
    current_count?: number; currentCount?: number;
    predicted_count?: number; predictedCount?: number;
    created_at?: string;
  }

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const health = await fetchHealth();
      const online = !!(health && health.ok);
      setBackendOnline(online);
      if (!online) {
        setCrowdData([]);
        setBuildingCatalog([]);
        setAlerts([]);
        setLoading(false);
        return;
      }
      // Load predictions and building catalog in parallel
      const [predictions, buildings] = await Promise.all([
        fetchPredictionsByHorizon(intervalMinutes) as Promise<PredictionRecord[]>,
        fetchBuildings().catch(() => []) as Promise<Array<{ id?: string; building_id?: string; name?: string; building_name?: string; capacity?: number }>>
      ]);

      const catalog = (buildings || []).map(b => ({
        buildingId: String(b.building_id || b.id),
        buildingName: b.building_name || b.name || String(b.building_id || b.id),
        capacity: typeof b.capacity === 'number' ? b.capacity : 100
      }));
      setBuildingCatalog(catalog);

      // predictions expected shape: [{ building_id, building_name, horizon_min, current_count, predicted_count, created_at }]
      const transformed: CrowdData[] = (predictions || []).map((p: PredictionRecord) => {
        const id = String(p.building_id || p.buildingId);
        const fromCat = catalog.find(c => c.buildingId === id);
        return {
          buildingId: id,
          buildingName: p.building_name || p.buildingName || fromCat?.buildingName || id,
          currentCount: Number(p.current_count ?? p.currentCount ?? 0),
          predictedCount: Number(p.predicted_count ?? p.predictedCount ?? 0),
          timestamp: p.created_at || new Date().toISOString(),
          color: '#55a3ff',
          capacity: typeof fromCat?.capacity === 'number' ? fromCat.capacity : 100
        };
      });

      setCrowdData(transformed);
      setLastSync(new Date().toLocaleTimeString());
      const newAlerts = checkCapacityAlerts(transformed);
      setAlerts(newAlerts);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load predictions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [intervalMinutes, checkCapacityAlerts]);

  // Load once on mount and when horizon changes; no auto-refresh
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data by building or search term
  const filteredData: CrowdData[] = useMemo(() => {
    if (selectedBuilding !== "all") {
      // If a specific building is selected, show only that building
      return crowdData.filter((d) => d.buildingId === selectedBuilding);
    } else if (searchTerm.trim()) {
      // If searching, filter by building name
      return crowdData.filter((d) =>
        d.buildingName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Show all buildings
      return crowdData;
    }
  }, [crowdData, selectedBuilding, searchTerm]);

  const fetchBuildingHistory = useCallback(async (): Promise<void> => {
    // History endpoint not available yet on prediction backend; omit for now
    setBuildingHistory([]);
  }, []);

  // Fetch building history when a building is selected (no auto refresh)
  useEffect(() => {
    if (selectedBuilding !== "all") {
      fetchBuildingHistory();
    } else {
      setBuildingHistory([]);
    }
  }, [selectedBuilding, fetchBuildingHistory]);

  const handleSearch = (query: string): void => {
    setSearchTerm(query);
    // If search is cleared, reset to show all buildings
    if (!query.trim()) {
      setSelectedBuilding("all");
    }
  };

  const handleBuildingSelect = (id: string): void => {
    setSelectedBuilding(id);
    // Clear search when building is selected from dropdown or search suggestions
    if (id !== "all") {
      setSearchTerm("");
    }
  };

  // View helpers
  const isSingleBuildingView = selectedBuilding !== "all";

  // Adaptive chart width for better density at low N
  const trendChartWidth = useMemo(() => {
    if (isSingleBuildingView) return 640;
    const n = filteredData.length;
    const base = n < 5 ? 840 : 1200;
    return Math.max(base, n * 140);
  }, [isSingleBuildingView, filteredData.length]);

  // Custom tooltip for overall trend
  const TrendTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: CrowdData }> }> = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload as CrowdData;
    const delta = (d.predictedCount ?? 0) - (d.currentCount ?? 0);
    const pct = d.capacity ? Math.round(((d.currentCount ?? 0) / d.capacity) * 100) : null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow-lg min-w-[220px]">
        <div className="font-semibold text-slate-800 mb-1">{d.buildingName}</div>
        <div className="text-sm text-slate-600 grid grid-cols-2 gap-x-3 gap-y-1">
          <span>Current</span><span className="text-slate-900 font-medium">{d.currentCount}</span>
          <span>Predicted</span><span className="text-slate-900 font-medium">{d.predictedCount}</span>
          <span>Delta</span>
          <span className={delta >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
            {delta >= 0 ? '+' : ''}{delta}
          </span>
          {pct !== null && <>
            <span>Utilization</span><span className="text-slate-900 font-medium">{pct}%</span>
          </>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pt-24 pb-8 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <LoadingView message="Loading crowd data..." />
        </div>
      </div>
    );
  }

  if (error && crowdData.length === 0) {
    return (
      <div className="pt-24 pb-8 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <ErrorView error={error} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8 min-h-screen bg-gray-50">
      {/* Removed legacy ribbon (using unified StatusRibbon below) */}
      <style>{`
        .chart-scroll-container::-webkit-scrollbar {
          height: 14px;
        }
        .chart-scroll-container::-webkit-scrollbar-track {
          background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .chart-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 8px;
          border: 2px solid #f8fafc;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .chart-scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .chart-scroll-container::-webkit-scrollbar-corner {
          background: #f8fafc;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-4 bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 m-0">Crowd Management</h1>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-0 rounded-lg font-medium cursor-pointer transition-all duration-200 shadow-md hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Sleek Status Ribbon */}
        <StatusRibbon
          backendOnline={backendOnline}
          apiBase={API_BASE_URL}
          horizonMin={intervalMinutes}
          lastSync={lastSync}
          crowded={(() => {
            const withUtil = crowdData.map(d => ({ id: d.buildingId, name: d.buildingName, value: Math.round((d.currentCount / Math.max(1, d.capacity)) * 100) }));
            return withUtil
              .sort((a,b)=>b.value-a.value)
              .slice(0,3)
              .map(c => ({ ...c, tone: c.value>=90?'crit': c.value>=75?'warn':'ok' }));
          })()}
          risers={(() => {
            const arr = crowdData.map(d => ({ id: d.buildingId, name: d.buildingName, value: d.predictedCount - d.currentCount }));
            return arr.sort((a,b)=>b.value-a.value).slice(0,2);
          })()}
          onChipClick={(id) => setSelectedBuilding(id)}
        />

        {!backendOnline && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
            Backend is offline. Showing no data.
          </div>
        )}

        {/* Live Timestamp */}
        <div className="text-sm text-gray-500 mb-6 bg-white px-4 py-3 rounded-lg border-l-4 border-emerald-500">
          <strong>Live Data Time:</strong> {crowdData[0]?.timestamp || "--:--"}
        </div>

        {/* Controls Section */}
        <div className="relative z-10 mb-8 rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as "current" | "predicted")}
                className="h-11 px-5 min-w-[160px] rounded-full border border-slate-300/70 bg-white/80 text-slate-700 text-sm shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:border-blue-400"
              >
                <option value="current">Current</option>
                <option value="predicted">Predicted</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Building</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedBuilding("all");
                    setSearchTerm("");
                  }}
                  className={`h-11 px-5 rounded-full font-medium text-sm transition focus:outline-none ${
                    selectedBuilding === "all"
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md'
                      : 'bg-white/80 text-slate-700 border border-slate-200/80 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  All
                </button>
                <select
                  value={selectedBuilding}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedBuilding(value);
                    if (value !== "all") {
                      setSearchTerm("");
                    }
                  }}
                  className="h-11 px-5 min-w-[180px] rounded-full border border-slate-300/70 bg-white/80 text-slate-700 text-sm shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:border-blue-400"
                >
                  <option value="all">All Buildings</option>
                  {(buildingCatalog.length ? buildingCatalog : crowdData).map((d) => (
                    <option key={d.buildingId} value={d.buildingId}>
                      {d.buildingName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Horizon (mins)</label>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="h-11 px-5 min-w-[160px] rounded-full border border-slate-300/70 bg-white/80 text-slate-700 text-sm shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:border-blue-400"
              >
                {intervalOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Search Buildings</label>
              <EnhancedSearchBar 
                onSearch={handleSearch}
                onBuildingSelect={handleBuildingSelect}
                buildings={(buildingCatalog.length ? buildingCatalog : crowdData.map(d => ({ buildingId: d.buildingId, buildingName: d.buildingName, capacity: d.capacity })) ).map(b => ({ buildingId: b.buildingId, buildingName: b.buildingName }))}
                placeholder="Search buildings..."
              />
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Alerts</label>
              <button
                onClick={() => setAlertSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`flex items-center gap-2 h-11 px-5 rounded-full font-medium text-sm transition focus:outline-none ${
                  alertSettings.enabled 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md' 
                    : 'bg-white/80 text-slate-700 border border-slate-200/80 hover:bg-white hover:shadow-sm'
                }`}
              >
                {alertSettings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {alertSettings.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Minimal controls retained above; removed grid/sort/export */}
          </div>
        </div>

        {/* Heat Map Section */}
        <div className="mb-8">
          <SvgHeatmap />
        </div>
        {/* Capacity Alerts Display */}
        {alerts.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border-l-4 border-orange-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Capacity Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.alertLevel === 'full' 
                    ? 'bg-red-50 border-red-500' 
                    : alert.alertLevel === 'critical'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{alert.buildingName}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.alertLevel === 'full' 
                        ? 'bg-red-100 text-red-800' 
                        : alert.alertLevel === 'critical'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.currentCount} / {alert.capacity} capacity</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend Section */}
        <div className="flex gap-8">
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${selectedBuilding !== "all" ? 'mr-96' : ''}`}>
            <div className="flex flex-col gap-8">
              {/* Overall Crowd Trend / Single Building Snapshot */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Chart Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      {isSingleBuildingView ? (
                        <>
                          <h2 className="text-2xl font-bold text-gray-800 mb-1">Building Snapshot</h2>
                          <p className="text-sm text-gray-600">Current vs predicted for selected building</p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-gray-800 mb-1">Overall Crowd Trend</h2>
                          <p className="text-sm text-gray-600">Real-time occupancy data across all buildings</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      Live Data
                    </div>
                  </div>
                </div>
                
                {/* Chart Container */}
                <div className="p-8">
                  {isSingleBuildingView ? (
                    <div className="grid place-items-center">
                      <div className="w-full max-w-3xl border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-inner p-6">
                        {(() => {
                          const single = filteredData[0];
                          const cap = single ? getBuildingCapacity(single.buildingId) : 100;
                          const data = single ? [{ name: single.buildingName, current: single.currentCount, predicted: single.predictedCount }] : [];
                          const delta = single ? (single.predictedCount - single.currentCount) : 0;
                          const deltaTone = delta >= 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200';
                          return (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-slate-600">Capacity: <span className="font-medium text-slate-800">{cap}</span></div>
                                <div className={`text-xs px-3 py-1 rounded-full border ${deltaTone}`}>Δ {delta >= 0 ? '+' : ''}{delta}</div>
                              </div>
                              <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" opacity={0.7} />
                                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} stroke="#6b7280" />
                                  <YAxis domain={[0, Math.max(cap, (single?.currentCount ?? 0), (single?.predictedCount ?? 0)) * 1.2]} tick={{ fontSize: 11, fill: '#374151' }} stroke="#6b7280" />
                                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: 12 }} />
                                  <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                                  <Bar dataKey="current" name="Current" fill="#8884d8" radius={[8,8,0,0]} />
                                  <Bar dataKey="predicted" name="Predicted" fill="#82ca9d" radius={[8,8,0,0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div 
                        className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white chart-scroll-container shadow-inner"
                        style={{ 
                          maxWidth: 'calc(100vw - 200px)',
                          width: '100%',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#CBD5E0 #F7FAFC'
                        }}
                      >
                        <div 
                          style={{ 
                            width: trendChartWidth,
                            height: 400,
                            padding: '20px'
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData} margin={{ top: 30, right: 40, left: 30, bottom: 100 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" opacity={0.7} />
                              <XAxis 
                                dataKey="buildingName"
                                tick={{ fontSize: 10, fill: '#374151' }}
                                angle={-45}
                                textAnchor="end"
                                height={90}
                                interval={0}
                                stroke="#6b7280"
                              />
                              <YAxis 
                                tick={{ fontSize: 11, fill: '#374151' }}
                                stroke="#6b7280"
                                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                                label={{ value: 'Occupancy Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#374151' } }}
                              />
                              <Tooltip content={(props) => <TrendTooltip {...props} />} />
                              <Legend 
                                wrapperStyle={{
                                  paddingTop: '20px',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="currentCount" 
                                name="Current Count" 
                                stroke="#8884d8" 
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#8884d8', strokeWidth: 2, stroke: '#ffffff' }}
                                activeDot={{ r: 7, fill: '#8884d8', strokeWidth: 3, stroke: '#ffffff' }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="predictedCount" 
                                name="Predicted Count" 
                                stroke="#82ca9d" 
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                dot={{ r: 5, fill: '#82ca9d', strokeWidth: 2, stroke: '#ffffff' }}
                                activeDot={{ r: 7, fill: '#82ca9d', strokeWidth: 3, stroke: '#ffffff' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chart Info */}
                {!isSingleBuildingView && (
                  <div className="mt-6 flex items-center justify-center">
                    <div className="bg-blue-50 px-6 py-3 rounded-full border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Scroll horizontally to view all {filteredData.length} buildings
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar for Selected Building */}
          {selectedBuilding !== "all" && (
            <div className="fixed right-8 top-32 bottom-8 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-y-auto z-30">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-40">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {crowdData.find(d => d.buildingId === selectedBuilding)?.buildingName}
                  </h3>
                  <button
                    onClick={() => setSelectedBuilding("all")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Gauge Chart for Selected Building */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {crowdData
                    .filter(d => d.buildingId === selectedBuilding)
                    .map(building => (
                      <GaugeChart
                        key={building.buildingId}
                        value={building.currentCount}
                        max={getBuildingCapacity(building.buildingId)}
                        title={`Occupancy`}
                      />
                    ))}
                </div>
                
                {/* Bar Chart */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Current vs Predicted</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="currentCount" fill="#8884d8" />
                      <Bar dataKey="predictedCount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Building History Chart */}
                {buildingHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Past 2 Minutes Variation
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={buildingHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="current_count" 
                          name="Current Count"
                          stroke="#8884d8" 
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrowdManagement;