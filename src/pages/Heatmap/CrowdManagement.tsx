import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
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
import { fetchBuildingHistoryByName, getIntervalOptions, getPollOptions } from "./utils/api";

// Building display names mapping
const BUILDING_NAMES: { [key: string]: string } = {
  B1: "Engineering Carpentry Shop",
  B2: "Engineering Workshop",
  B3: "",
  B4: "Generator Room",
  B5: "",
  B6: "Structure Lab",
  B7: "Administrative Building",
  B8: "Canteen",
  B9: "Lecture Room 10/11",
  B10: "Engineering Library",
  B11: "Department of Chemical and process Engineering",
  B12: "Lecture Room 2/3",
  B13: "Drawing Office 2 and Faculty Common Room",
  B14: "Faculty Canteen",
  B15: "Department of Manufacturing and Industrial Engineering",
  B16: "Professor E.O.E. Perera Theater",
  B17: "Electronic Lab",
  B18: "Washrooms",
  B19: "Electrical and Electronic Workshop",
  B20: "Department of Computer Engineering",
  B21: "",
  B22: "Environmental Lab",
  B23: "Applied Mechanics Lab",
  B24: "New Mechanics Lab",
  B25: "",
  B26: "",
  B27: "",
  B28: "Materials Lab",
  B29: "Thermodynamics Lab",
  B30: "Fluids Lab",
  B31: "Surveying and Soil Lab",
  B32: "Department of Engineering Mathematics",
  B33: "Drawing Office 1",
  B34: "Department of Electrical and Electronic Engineering",
};

// Custom tick component for multi-line text
const CustomTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value;
  
  // Split long text into multiple lines
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= 20) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 12 + 15}
          textAnchor="middle"
          fill="#374151"
          fontSize="10"
          fontWeight="500"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

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

interface RealTimeData {
  building_id: string;
  building_name: string;
  current_crowd: number;
  building_capacity: number;
  color: string;
  status_timestamp: string;
}

const CrowdManagement: React.FC = () => {
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [buildingHistory, setBuildingHistory] = useState<BuildingHistoryData[]>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);
  
  const intervalOptions = getIntervalOptions();
  const intervalMinutes = intervalOptions.includes(30) ? 30 : intervalOptions[0];
  
  const pollOptions = getPollOptions();
  const pollSeconds = pollOptions.includes(10) ? 10 : pollOptions[0];

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch real-time data from QR API
  const fetchRealTimeData = useCallback(async (): Promise<void> => {
    try {
      const API_URL = import.meta.env.VITE_HEATMAP_API_URL 
        ? `${import.meta.env.VITE_HEATMAP_API_URL}/heatmap/map-data` 
        : "http://localhost:3897/heatmap/map-data";
      
      const response = await axios.get(API_URL);
      if (response.data.success && response.data.data) {
        setRealTimeData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching real-time data:", err);
    }
  }, []);

  // Start real-time data fetching
  useEffect(() => {
    fetchRealTimeData(); // Initial fetch
    realTimeIntervalRef.current = setInterval(fetchRealTimeData, 15000); // Every 15 seconds
    
    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
      }
    };
  }, [fetchRealTimeData]);

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
      <div className="pt-24 pb-8 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="glass-card p-12 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Crowd Data</h2>
          <p className="text-gray-600">Fetching real-time building occupancy information...</p>
        </div>
      </div>
    );
  }

  if (error && crowdData.length === 0) {
    return (
      <div className="pt-24 pb-8 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="glass-card p-12 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <style>{`
        .chart-scroll-container::-webkit-scrollbar {
          height: 18px;
        }
        .chart-scroll-container::-webkit-scrollbar-track {
          background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          margin: 0 12px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
        }
        .chart-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%);
          border-radius: 12px;
          border: 3px solid #f8fafc;
          box-shadow: 
            0 4px 8px rgba(16, 185, 129, 0.25),
            inset 0 1px 2px rgba(255,255,255,0.3);
          transition: all 0.3s ease;
        }
        .chart-scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #059669 0%, #047857 50%, #065f46 100%);
          box-shadow: 
            0 6px 16px rgba(16, 185, 129, 0.4),
            inset 0 1px 2px rgba(255,255,255,0.4);
          transform: scale(1.05);
        }
        .chart-scroll-container::-webkit-scrollbar-corner {
          background: #f8fafc;
          border-radius: 12px;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }
        .glass-card-dark {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 
            0 32px 64px -12px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset,
            0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-slideUp {
          animation: slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-lift {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 
            0 35px 60px -12px rgba(0, 0, 0, 0.18),
            0 20px 25px -5px rgba(0, 0, 0, 0.12);
        }
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #6B73FF 50%, #9D50BB 75%, #6B73FF 100%);
          background-size: 300% 300%;
          animation: gradientShift 6s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .chart-container {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%);
          backdrop-filter: blur(30px) saturate(150%);
          border: 2px solid rgba(255,255,255,0.4);
          box-shadow: 
            0 25px 50px -12px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .status-indicator {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .legend-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(16, 185, 129, 0.2);
          box-shadow: 
            0 20px 25px -5px rgba(16, 185, 129, 0.1),
            0 10px 10px -5px rgba(16, 185, 129, 0.04),
            inset 0 1px 0 rgba(255,255,255,0.7);
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="mb-8 glass-card-dark p-10 rounded-3xl shadow-2xl hover-lift animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black gradient-text mb-3 leading-tight">
                Crowd Management
              </h1>
              <p className="text-gray-600 text-xl font-medium">Real-time building occupancy monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border border-green-200 shadow-lg">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full status-indicator"></div>
                <span className="text-green-800 font-bold text-sm">Live Data Active</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border border-blue-200 shadow-lg">
                <span className="text-blue-800 font-bold text-sm">
                  {realTimeData.length} Buildings Monitored
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Heat Map Section */}
        <div className="mb-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card-dark rounded-3xl shadow-2xl overflow-hidden hover-lift">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white flex items-center mb-2">
                  <div className="p-3 bg-white/20 rounded-2xl mr-4 backdrop-blur-sm">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Campus Heat Map
                </h2>
                <p className="text-blue-100 text-lg font-medium">Interactive building occupancy visualization</p>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
              <SvgHeatmap />
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex gap-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-500 ease-in-out ${selectedBuilding !== "all" ? 'mr-96' : ''}`}>
            <div className="flex flex-col gap-8">
              {/* Real-Time Crowd Chart */}
              <div className="glass-card rounded-2xl shadow-xl overflow-hidden hover-lift">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Real-Time Building Occupancy
                      </h2>
                      <p className="text-green-100 mt-1">Live data from QR code scans across campus buildings</p>
                    </div>
                    <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-full">
                      <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                      <span className="text-green-100 font-medium text-sm">
                        {realTimeData.length} Buildings
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  {realTimeData.length > 0 ? (
                    <div className="flex justify-center">
                      {/* Fixed Legend */}
                      <div className="w-full max-w-6xl">
                        <div className="flex justify-center mb-4">
                          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-green-200 shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-0.5 bg-green-600 rounded"></div>
                                <span className="text-sm font-medium text-gray-700">Visitor Count</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Scrollable Chart */}
                        <div className="overflow-x-auto overflow-y-hidden rounded-xl bg-gradient-to-br from-white/60 to-gray-50/40 backdrop-blur-sm border border-white/30 shadow-lg chart-scroll-container">
                          <div className="p-6">
                            <div className="mx-auto" style={{ minWidth: `${Math.max(1200, realTimeData.length * 180)}px` }}>
                              <ResponsiveContainer width="100%" height={400}>
                        <LineChart 
                          data={realTimeData
                            .map(building => ({
                              buildingId: building.building_id,
                              buildingName: BUILDING_NAMES[building.building_id] && BUILDING_NAMES[building.building_id].trim() !== '' 
                                ? BUILDING_NAMES[building.building_id] 
                                : building.building_name || `Building ${building.building_id}`,
                              currentCrowd: building.current_crowd,
                              capacity: building.building_capacity,
                              utilizationPercent: Math.round((building.current_crowd / building.building_capacity) * 100)
                            }))
                            .sort((a, b) => {
                              // Extract numeric part from building IDs (B1 -> 1, B10 -> 10, etc.)
                              const numA = parseInt(a.buildingId.replace(/^B0*/, ""), 10);
                              const numB = parseInt(b.buildingId.replace(/^B0*/, ""), 10);
                              return numA - numB;
                            })}
                          margin={{ top: 20, right: 60, left: 20, bottom: 10}}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />
                          <XAxis 
                            dataKey="buildingName"
                            tick={<CustomTick />}
                            angle={0}
                            textAnchor="middle"
                            height={120}
                            interval={0}
                            stroke="#6b7280"
                            tickMargin={20}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#374151' }}
                            stroke="#6b7280"
                            label={{ 
                              value: 'Visitor Count', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: '#374151' }
                            }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '13px'
                            }}
                            formatter={(value, _, props) => [
                              <>
                                <div className="font-medium">{props.payload.buildingName}</div>
                                <div className="text-sm text-gray-600">
                                  Current: {value} people<br/>
                                  Capacity: {props.payload.capacity}
                                </div>
                              </>,
                              ''
                            ]}
                            labelFormatter={() => ''}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="currentCrowd" 
                            stroke="#059669" 
                            strokeWidth={3}
                            dot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 8, fill: '#047857', strokeWidth: 3, stroke: '#ffffff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading real-time data from QR systems...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar for Selected Building */}
          {selectedBuilding !== "all" && (
            <div className="fixed right-8 top-32 bottom-8 w-80 glass-card rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-30 animate-fadeIn">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 z-40">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Building Details
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {crowdData.find(d => d.buildingId === selectedBuilding)?.buildingName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBuilding("all")}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                {/* Building Stats */}
                {crowdData
                  .filter(d => d.buildingId === selectedBuilding)
                  .map(building => (
                    <div key={building.buildingId} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{building.currentCount}</p>
                          <p className="text-sm text-gray-600">Current</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{building.capacity}</p>
                          <p className="text-sm text-gray-600">Capacity</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Utilization</span>
                          <span className="text-sm font-bold text-gray-800">
                            {Math.round((building.currentCount / building.capacity) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((building.currentCount / building.capacity) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {/* Bar Chart */}
                <div className="bg-gray-50 rounded-xl p-6 hover-lift">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Current vs Predicted
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="currentCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="predictedCount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Building History Chart */}
                {buildingHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6 hover-lift">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Trend Analysis
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={buildingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="current_count" 
                          name="Current Count"
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#3b82f6' }}
                          activeDot={{ r: 6, fill: '#1d4ed8' }}
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