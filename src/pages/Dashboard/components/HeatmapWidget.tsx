import React, { useState, useMemo } from "react";
import { MapPin, Thermometer, Activity, Clock, Users } from "lucide-react";
import ChatClient from "./ChatClient";

interface Building {
  id: number;
  name: string;
  peak: number;
  dwell: number;
  activity: "High" | "Medium" | "Low";
  color: "red" | "yellow" | "green";
  icon: typeof Users;
}

interface Zone {
  name: string;
  buildings: Building[];
}

const HeatmapWidget: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState("1h");
  const [zoneFilter, setZoneFilter] = useState("zoneA");
  const [buildingFilter, setBuildingFilter] = useState("all");

  const allZones: Record<string, Zone> = {
    zoneA: {
      name: "Zone A",
      buildings: [
        { id: 22, name: "Drawing Office 2", peak: 95, dwell: 18, activity: "Medium", color: "yellow", icon: Activity },
        { id: 28, name: "Department of Manufacturing and Industrial Engineering", peak: 140, dwell: 24, activity: "High", color: "red", icon: Users },
        { id: 23, name: "Corridor", peak: 60, dwell: 10, activity: "Low", color: "green", icon: Clock },
        { id: 24, name: "Lecture Room(middle-right)", peak: 80, dwell: 15, activity: "Low", color: "green", icon: Clock },
        { id: 25, name: "Structures Laboratory", peak: 120, dwell: 22, activity: "Medium", color: "yellow", icon: Activity },
        { id: 26, name: "Lecture Room(bottom-right)", peak: 75, dwell: 12, activity: "Low", color: "green", icon: Clock },
        { id: 27, name: "Engineering Library", peak: 160, dwell: 30, activity: "High", color: "red", icon: Users },
      ],
    },
    zoneB: {
      name: "Zone B",
      buildings: [
        { id: 3, name: "Drawing Office 1", peak: 90, dwell: 16, activity: "Low", color: "green", icon: Clock },
        { id: 4, name: "Professor E.O.E. Pereira Theatre", peak: 180, dwell: 28, activity: "High", color: "red", icon: Users },
        { id: 5, name: "Administrative Building", peak: 100, dwell: 18, activity: "Medium", color: "yellow", icon: Activity },
        { id: 6, name: "Security Unit", peak: 70, dwell: 12, activity: "Low", color: "green", icon: Clock },
        { id: 1, name: "Department of Chemical and Process Engineering", peak: 150, dwell: 25, activity: "High", color: "red", icon: Users },
        { id: 2, name: "Department Engineering Mathematics", peak: 120, dwell: 20, activity: "Medium", color: "yellow", icon: Activity },
      ],
    },
    zoneC: {
      name: "Zone C",
      buildings: [
        { id: 8, name: "Department of Electrical and Electronic Engineering", peak: 160, dwell: 28, activity: "High", color: "red", icon: Users },
        { id: 9, name: "Department of Computer Engineering", peak: 140, dwell: 22, activity: "Medium", color: "yellow", icon: Activity },
        { id: 10, name: "Electrical and Electronic Workshop", peak: 100, dwell: 18, activity: "Low", color: "green", icon: Clock },
        { id: 11, name: "Surveying Lab", peak: 95, dwell: 15, activity: "Low", color: "green", icon: Clock },
        { id: 12, name: "Soil Lab", peak: 105, dwell: 17, activity: "Medium", color: "yellow", icon: Activity },
        { id: 13, name: "Materials Lab", peak: 115, dwell: 19, activity: "Medium", color: "yellow", icon: Activity },
      ],
    },
    zoneD: {
      name: "Zone D",
      buildings: [
        { id: 15, name: "Fluids Lab", peak: 125, dwell: 22, activity: "Medium", color: "yellow", icon: Activity },
        { id: 16, name: "New Mechanics Lab", peak: 135, dwell: 23, activity: "Medium", color: "yellow", icon: Activity },
        { id: 17, name: "Applied Mechanics Lab", peak: 145, dwell: 24, activity: "High", color: "red", icon: Users },
        { id: 18, name: "Thermodynamics Lab", peak: 155, dwell: 26, activity: "High", color: "red", icon: Users },
        { id: 19, name: "Generator Room", peak: 65, dwell: 10, activity: "Low", color: "green", icon: Clock },
        { id: 20, name: "Engineering Workshop", peak: 175, dwell: 27, activity: "High", color: "red", icon: Users },
        { id: 21, name: "Engineering Carpentry Shop", peak: 80, dwell: 12, activity: "Low", color: "green", icon: Clock },
      ],
    },
  };

  const buildingsInZone = useMemo(
    () => allZones[zoneFilter]?.buildings || [],
    [zoneFilter]
  );

  const filteredBuildings = useMemo(() => {
    if (buildingFilter === "all") return buildingsInZone;
    return buildingsInZone.filter((b) => b.name === buildingFilter);
  }, [buildingFilter, buildingsInZone]);

  const colorClasses: Record<string, string> = {
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
    green: "from-green-500 to-green-600",
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap justify-end gap-3">
        <select
          value={zoneFilter}
          onChange={(e) => {
            setZoneFilter(e.target.value);
            setBuildingFilter("all");
          }}
          className="border px-3 py-2 rounded"
        >
          {Object.entries(allZones).map(([key, zone]) => (
            <option key={key} value={key}>
              {zone.name}
            </option>
          ))}
        </select>

        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Buildings</option>
          {buildingsInZone.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="1h">Last 1 Hour</option>
          <option value="3h">Last 3 Hours</option>
          <option value="5h">Last 5 Hours</option>
          <option value="12h">Last 12 Hours</option>
          <option value="24h">Last 24 Hours</option>
        </select>
      </div>

      {/* Chat Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white shadow-lg">
              <Thermometer size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Live Chat</h3>
              <p className="text-gray-600">Real-time communication</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            Live Data
          </div>
        </div>
        <ChatClient socketUrl="ws://localhost:3001" />
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredBuildings.map((b) => (
          <div
            key={b.id}
            className={`group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-xl text-white shadow-lg ${colorClasses[b.color]}`}>
                <b.icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{b.name}</h4>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                    b.activity === "High"
                      ? "bg-red-100 text-red-700"
                      : b.activity === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {b.activity} Activity
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
              <span className="text-sm text-gray-600 flex items-center space-x-2">
                <Users size={14} />
                <span>Peak Occupancy:</span>
              </span>
              <span className="text-sm font-bold text-gray-900">{b.peak}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
              <span className="text-sm text-gray-600 flex items-center space-x-2">
                <Clock size={14} />
                <span>Avg. Dwell Time:</span>
              </span>
              <span className="text-sm font-bold text-gray-900">{b.dwell} min</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapWidget;
