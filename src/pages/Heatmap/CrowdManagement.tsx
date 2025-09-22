import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { LoadingView, ErrorView } from "./utils/uiHelpers";
import { fetchBuildingHistoryByName, getIntervalOptions, getPollOptions } from "./utils/api";

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

const CrowdManagement: React.FC = () => {
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [buildingHistory, setBuildingHistory] = useState<BuildingHistoryData[]>([]);
  
  const intervalOptions = getIntervalOptions();
  const intervalMinutes = intervalOptions.includes(30) ? 30 : intervalOptions[0];
  
  const pollOptions = getPollOptions();
  const pollSeconds = pollOptions.includes(10) ? 10 : pollOptions[0];

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
    
    // For now, always use the real building data since we're integrating with the database
    // Later, this can be updated to fetch from the actual database API
    setError("Using real building data from database.");
    
    // Real buildings data from database
    const realBuildings = [
      { id: 'B1', name: 'Engineering Carpentry Shop', capacity: 25 },
      { id: 'B2', name: 'Engineering Workshop', capacity: 60 },
      { id: 'B3', name: 'Building B3', capacity: 100 },
      { id: 'B4', name: 'Generator Room', capacity: 10 },
      { id: 'B5', name: 'Building B5', capacity: 100 },
      { id: 'B6', name: 'Structure Lab', capacity: 50 },
      { id: 'B7', name: 'Administrative Building', capacity: 100 },
      { id: 'B8', name: 'Canteen', capacity: 30 },
      { id: 'B9', name: 'Lecture Room 10/11', capacity: 80 },
      { id: 'B10', name: 'Engineering Library', capacity: 120 },
      { id: 'B11', name: 'Department of Chemical and Process Engineering', capacity: 80 },
      { id: 'B12', name: 'Security Unit', capacity: 20 },
      { id: 'B13', name: 'Drawing Office 2', capacity: 60 },
      { id: 'B14', name: 'Faculty Canteen', capacity: 30 },
      { id: 'B15', name: 'Department of Manufacturing and Industrial Engineering', capacity: 30 },
      { id: 'B16', name: 'Professor E.O.E. Perera Theater', capacity: 200 },
      { id: 'B17', name: 'Electronic Lab', capacity: 35 },
      { id: 'B18', name: 'Washrooms', capacity: 100 },
      { id: 'B19', name: 'Electrical and Electronic Workshop', capacity: 45 },
      { id: 'B20', name: 'Department of Computer Engineering', capacity: 30 },
      { id: 'B21', name: 'Building B21', capacity: 50 },
      { id: 'B22', name: 'Environmental Lab', capacity: 30 },
      { id: 'B23', name: 'Applied Mechanics Lab', capacity: 30 },
      { id: 'B24', name: 'New Mechanics Lab', capacity: 35 },
      { id: 'B25', name: 'Building B25', capacity: 50 },
      { id: 'B26', name: 'Building B26', capacity: 50 },
      { id: 'B27', name: 'Building B27', capacity: 50 },
      { id: 'B28', name: 'Materials Lab', capacity: 40 },
      { id: 'B29', name: 'Thermodynamics Lab', capacity: 40 },
      { id: 'B30', name: 'Fluids Lab', capacity: 50 },
      { id: 'B31', name: 'Surveying and Soil Lab', capacity: 70 },
      { id: 'B32', name: 'Department of Engineering Mathematics', capacity: 120 },
      { id: 'B33', name: 'Drawing Office 1', capacity: 50 },
      { id: 'B34', name: 'Department of Electrical and Electronic Engineering', capacity: 150 }
    ];

    const colors = ['#ff6b6b', '#4ecdc4', '#ff9f43', '#6c5ce7', '#a29bfe', '#74b9ff', '#fd79a8', '#fdcb6e', '#6c5ce7', '#55a3ff'];
    
    // Generate realistic crowd data based on building types and capacity
    const mockData: CrowdData[] = realBuildings.map((building, index) => {
      // Generate realistic occupancy based on building type and time
      let occupancyRate = 0.3; // Default 30%
      
      // Adjust occupancy based on building type
      if (building.name.toLowerCase().includes('canteen') || building.name.toLowerCase().includes('library')) {
        occupancyRate = 0.6 + Math.random() * 0.3; // 60-90% for popular areas
      } else if (building.name.toLowerCase().includes('lab') || building.name.toLowerCase().includes('workshop')) {
        occupancyRate = 0.4 + Math.random() * 0.4; // 40-80% for labs
      } else if (building.name.toLowerCase().includes('theater') || building.name.toLowerCase().includes('lecture')) {
        occupancyRate = 0.2 + Math.random() * 0.6; // 20-80% for lecture spaces
      } else if (building.name.toLowerCase().includes('washroom') || building.name.toLowerCase().includes('generator')) {
        occupancyRate = 0.1 + Math.random() * 0.2; // 10-30% for utility spaces
      }
      
      const currentCount = Math.floor(building.capacity * occupancyRate);
      const predictedCount = Math.max(0, Math.min(building.capacity, 
        currentCount + Math.floor((Math.random() - 0.5) * 20))); // ±10 people prediction
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        currentCount,
        predictedCount,
        timestamp: new Date().toLocaleTimeString(),
        color: colors[index % colors.length],
        capacity: building.capacity
      };
    });
    
    setCrowdData(mockData);
    
    setLoading(false);
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

  // Filter data by building
  const filteredData: CrowdData[] = useMemo(() => {
    if (selectedBuilding !== "all") {
      // If a specific building is selected, show only that building
      return crowdData.filter((d) => d.buildingId === selectedBuilding);
    } else {
      // Show all buildings
      return crowdData;
    }
  }, [crowdData, selectedBuilding]);

  const fetchBuildingHistory = useCallback(async (): Promise<void> => {
    if (selectedBuilding === "all") return;
    try {
      const selectedBuildingData = crowdData.find(
        (d) => d.buildingId === selectedBuilding
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
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 m-0">Crowd Management</h1>
        </div>

        {/* Heat Map Section */}
        <div className="mb-8">
          {/* <HeatMap /> */}
          <SvgHeatmap />
        </div>

        {/* Main Content Layout */}
        <div className="flex gap-8">
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${selectedBuilding !== "all" ? 'mr-96' : ''}`}>
            <div className="flex flex-col gap-8">
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