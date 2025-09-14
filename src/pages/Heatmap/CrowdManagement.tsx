import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RefreshCw } from "lucide-react";
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
import { fetchCrowd, fetchBuildingHistoryByName, getIntervalOptions, getPollOptions } from "./utils/api";

interface CrowdData {
  buildingId: number;
  buildingName: string;
  currentCount: number;
  predictedCount: number;
  timestamp: string;
  color: string;
  capacity?: number;
}

interface BuildingHistoryData {
  timestamp: string;
  current_count: number;
}

interface DefaultCapacities {
  [key: number]: number;
}

const CrowdManagement: React.FC = () => {
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"current" | "predicted">("current");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [buildingHistory, setBuildingHistory] = useState<BuildingHistoryData[]>([]);
  
  const intervalOptions = getIntervalOptions();
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => 
    intervalOptions.includes(30) ? 30 : intervalOptions[0]
  );
  
  const pollOptions = getPollOptions();
  const [pollSeconds, setPollSeconds] = useState<number>(() => 
    pollOptions.includes(10) ? 10 : pollOptions[0]
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch building history data when a building is selected, and refresh every 5 seconds
  useEffect(() => {
    if (selectedBuilding !== "all") {
      fetchBuildingHistory();
      historyIntervalRef.current = setInterval(fetchBuildingHistory, 5000);
    } else {
      setBuildingHistory([]);
      if (historyIntervalRef.current) {
        clearInterval(historyIntervalRef.current);
      }
    }

    return () => {
      if (historyIntervalRef.current) {
        clearInterval(historyIntervalRef.current);
      }
    };
  }, [selectedBuilding]);

  const fetchData = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const data = await fetchCrowd(intervalMinutes);
      setCrowdData(data);
      setLoading(false);
    } catch (err) {
      setError("Error loading crowd data. Using mock data for demonstration.");
      // Use mock data for development
      const mockData: CrowdData[] = [
        {
          buildingId: 1,
          buildingName: "Faculty Canteen",
          currentCount: 85,
          predictedCount: 92,
          timestamp: new Date().toLocaleTimeString(),
          color: "#ff6b6b",
          capacity: 120
        },
        {
          buildingId: 2,
          buildingName: "Lecture Hall 1",
          currentCount: 65,
          predictedCount: 70,
          timestamp: new Date().toLocaleTimeString(),
          color: "#4ecdc4",
          capacity: 100
        },
        {
          buildingId: 3,
          buildingName: "Drawing Office 1",
          currentCount: 110,
          predictedCount: 125,
          timestamp: new Date().toLocaleTimeString(),
          color: "#ff9f43",
          capacity: 150
        },
        {
          buildingId: 4,
          buildingName: "Library",
          currentCount: 140,
          predictedCount: 155,
          timestamp: new Date().toLocaleTimeString(),
          color: "#6c5ce7",
          capacity: 200
        },
        {
          buildingId: 5,
          buildingName: "Lab 1",
          currentCount: 45,
          predictedCount: 50,
          timestamp: new Date().toLocaleTimeString(),
          color: "#a29bfe",
          capacity: 80
        }
      ];
      setCrowdData(mockData);
      setLoading(false);
    }
  }, [intervalMinutes]);

  // Fetch crowd data initially and then on a user-defined cadence (seconds). 0 means paused.
  useEffect(() => {
    fetchData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pollSeconds > 0) {
      intervalRef.current = setInterval(fetchData, pollSeconds * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, pollSeconds]);

  // Filter data by building or search term
  const filteredData: CrowdData[] = useMemo(() => {
    if (selectedBuilding !== "all") {
      // If a specific building is selected, show only that building
      return crowdData.filter((d) => String(d.buildingId) === String(selectedBuilding));
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
    if (selectedBuilding === "all") return;
    try {
      const selectedBuildingData = crowdData.find(
        (d) => String(d.buildingId) === String(selectedBuilding)
      );
      if (selectedBuildingData) {
        const buildingName = selectedBuildingData.buildingName;
        const data = await fetchBuildingHistoryByName(buildingName);
        setBuildingHistory(data);
      }
    } catch (err) {
      console.error("Error fetching building history:", err);
      // Use mock history data for development
      const mockHistory: BuildingHistoryData[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 5000).toLocaleTimeString(),
        current_count: Math.floor(Math.random() * 100) + 20
      }));
      setBuildingHistory(mockHistory);
    }
  }, [crowdData, selectedBuilding]);

  // Fetch building history when a building is selected, with periodic refresh (same cadence)
  useEffect(() => {
    if (selectedBuilding !== "all") {
      fetchBuildingHistory();
      if (historyIntervalRef.current) clearInterval(historyIntervalRef.current);
      if (pollSeconds > 0) {
        historyIntervalRef.current = setInterval(fetchBuildingHistory, pollSeconds * 1000);
      }
    } else {
      setBuildingHistory([]);
      if (historyIntervalRef.current) clearInterval(historyIntervalRef.current);
    }
    return () => {
      if (historyIntervalRef.current) clearInterval(historyIntervalRef.current);
    };
  }, [selectedBuilding, fetchBuildingHistory, pollSeconds]);

  // Get building capacity (for the gauge chart)
  const getBuildingCapacity = (buildingId: number): number => {
    const defaultCapacities: Record<number, number> = {
      1: 120, // Faculty Canteen
      2: 100, // Lecture Hall 1
      3: 150, // Drawing Office 1
      4: 200, // Library
      5: 80,  // Lab 1
      6: 90,  // Lecture Hall 2
      7: 130, // Drawing Office 2
    };
    
    const building = crowdData.find(d => String(d.buildingId) === String(buildingId));
    return building?.capacity || defaultCapacities[buildingId] || 100;
  };

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
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 m-0">Crowd Management</h1>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-0 rounded-lg font-medium cursor-pointer transition-all duration-200 shadow-md hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Live Timestamp */}
        <div className="text-sm text-gray-500 mb-6 bg-white px-4 py-3 rounded-lg border-l-4 border-emerald-500">
          <strong>Live Data Time:</strong> {crowdData[0]?.timestamp || "--:--"}
        </div>

        {/* Controls Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 relative z-20">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-sm font-medium text-gray-700">View Mode:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as "current" | "predicted")}
                className="px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm transition-all duration-150 min-w-[150px] focus:outline-none focus:border-blue-500 focus:shadow-sm focus:shadow-blue-100"
              >
                <option value="current">Current</option>
                <option value="predicted">Predicted</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-sm font-medium text-gray-700">Building:</label>
              <select
                value={selectedBuilding}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedBuilding(value);
                  // Clear search when building is selected from dropdown
                  if (value !== "all") {
                    setSearchTerm("");
                  }
                }}
                className="px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm transition-all duration-150 min-w-[150px] focus:outline-none focus:border-blue-500 focus:shadow-sm focus:shadow-blue-100"
              >
                <option value="all">All Buildings</option>
                {crowdData.map((d) => (
                  <option key={d.buildingId} value={d.buildingId}>
                    {d.buildingName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-sm font-medium text-gray-700">Horizon (mins):</label>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm transition-all duration-150 min-w-[150px] focus:outline-none focus:border-blue-500 focus:shadow-sm focus:shadow-blue-100"
              >
                {intervalOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-sm font-medium text-gray-700">Auto-refresh (sec):</label>
              <select
                value={pollSeconds}
                onChange={(e) => setPollSeconds(Number(e.target.value))}
                className="px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm transition-all duration-150 min-w-[150px] focus:outline-none focus:border-blue-500 focus:shadow-sm focus:shadow-blue-100"
              >
                {pollOptions.map(s => (
                  <option key={s} value={s}>{s === 0 ? "Paused" : s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-sm font-medium text-gray-700">Search Buildings:</label>
              <EnhancedSearchBar 
                onSearch={handleSearch}
                onBuildingSelect={handleBuildingSelect}
                buildings={crowdData.map(d => ({
                  buildingId: d.buildingId,
                  buildingName: d.buildingName
                }))}
                placeholder="Search buildings..."
              />
            </div>
          </div>
        </div>

        {/* Heat Map Section */}
        <div className="mb-8">
          {/* <HeatMap /> */}
          <SvgHeatmap />
        </div>

        {/* Charts Section */}
        <div className="flex flex-col gap-8">
          {selectedBuilding === "all" ? (
            // When "All" buildings selected - show only overall trend
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Crowd Trend</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="buildingName"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="currentCount" 
                    name="Current Count" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedCount" 
                    name="Predicted Count" 
                    stroke="#82ca9d" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // When specific building selected - show all charts for that building
            <>
              {/* Gauge Chart for Selected Building */}
              <div className="my-8">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  {crowdData
                    .filter(d => String(d.buildingId) === String(selectedBuilding))
                    .map(building => (
                      <GaugeChart
                        key={building.buildingId}
                        value={building.currentCount}
                        max={getBuildingCapacity(building.buildingId)}
                        title={`${building.buildingName} Occupancy`}
                      />
                    ))}
                </div>
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Line Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Crowd Trend</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="currentCount" stroke="#8884d8" />
                      <Line type="monotone" dataKey="predictedCount" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Current vs Predicted</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="currentCount" fill="#8884d8" />
                      <Bar dataKey="predictedCount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Building History Chart - Past 120 seconds */}
              {buildingHistory.length > 0 && (
                <div className="mt-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Past 2 Minutes Crowd Variation
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={buildingHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="current_count" 
                          name="Current Count"
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrowdManagement;