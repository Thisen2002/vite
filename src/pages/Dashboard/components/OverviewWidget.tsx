import React, { useState } from "react";
import { TrendingUp, Users, MapPin, Clock, BarChart3 } from "lucide-react";

const OverviewWidget: React.FC = () => {
  // ✅ Default: Zone A, Drawing Office 2, Last 1 Hour
  const [timeRange, setTimeRange] = useState("1h");
  const [zone, setZone] = useState("zone1");
  const [building, setBuilding] = useState("booth22");

  // ✅ Zone → Buildings mapping
  const zoneBuildings: Record<string, { id: string; name: string }[]> = {
    zone1: [
      { name: "Drawing Office 2", id: "booth22" },
      { name: "Department of Manufacturing and Industrial Engineering", id: "booth28" },
      { name: "Corridor", id: "booth23" },
      { name: "Lecture Room (middle-right)", id: "booth24" },
      { name: "Structures Laboratory", id: "booth25" },
      { name: "Lecture Room (bottom-right)", id: "booth26" },
      { name: "Engineering Library", id: "booth27" },
    ],
    zone2: [
      { name: "Drawing Office 1", id: "booth3" },
      { name: "Professor E.O.E. Pereira Theatre", id: "booth4" },
      { name: "Administrative Building", id: "booth5" },
      { name: "Security Unit", id: "booth6" },
      { name: "Department of Chemical and Process Engineering", id: "booth1" },
      { name: "Department Engineering Mathematics", id: "booth2" },
    ],
    zone3: [
      { name: "Department of Electrical and Electronic Engineering", id: "booth8" },
      { name: "Department of Computer Engineering", id: "booth9" },
      { name: "Electrical and Electronic Workshop", id: "booth10" },
      { name: "Surveying Lab", id: "booth11" },
      { name: "Soil Lab", id: "booth12" },
      { name: "Materials Lab", id: "booth13" },
    ],
    zone4: [
      { name: "Fluids Lab", id: "booth15" },
      { name: "New Mechanics Lab", id: "booth16" },
      { name: "Applied Mechanics Lab", id: "booth17" },
      { name: "Thermodynamics Lab", id: "booth18" },
      { name: "Generator Room", id: "booth19" },
      { name: "Engineering Workshop", id: "booth20" },
      { name: "Engineering Carpentry Shop", id: "booth21" },
    ],
  };

  // Mock stats (replace with API response later)
  const stats = [
    {
      label: "Total Attendees",
      value: building === "booth22" ? "432" : "2,847",
      change: "+12%",
      icon: Users,
      color: "blue",
    },
    {
      label: "Check-ins",
      value: building === "booth22" ? "278" : "2,341",
      change: "+8%",
      icon: MapPin,
      color: "green",
    },
    {
      label: "Avg. Session Time",
      value: building === "booth22" ? "2h 12m" : "4h 32m",
      change: "+15%",
      icon: Clock,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
    };
    return colors[color as keyof typeof colors];
  };

  const getBgColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50/80",
      green: "bg-green-50/80",
      purple: "bg-purple-50/80",
      orange: "bg-orange-50/80",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-8">
      {/* 🔽 Filters Row */}
      <div className="flex flex-wrap justify-end gap-3">
        {/* Zone filter */}
        <select
          value={zone}
          onChange={(e) => {
            const selectedZone = e.target.value;
            setZone(selectedZone);
            // Reset building to first in zone
            setBuilding(zoneBuildings[selectedZone][0].id);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="zone1">Zone A</option>
          <option value="zone2">Zone B</option>
          <option value="zone3">Zone C</option>
          <option value="zone4">Zone D</option>
        </select>

        {/* Building filter (filtered by zone) */}
        <select
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          {zoneBuildings[zone].map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Time filter */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="1h">Last 1 Hour</option>
          <option value="3h">Last 3 Hours</option>
          <option value="5h">Last 5 Hours</option>
          <option value="12h">Last 12 Hours</option>
          <option value="24h">Last 24 Hours</option>
        </select>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 ${getBgColorClasses(
                  stat.color
                )} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(
                      stat.color
                    )} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                    <TrendingUp size={14} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📈 Chart + Popular Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Attendance Over Time
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {timeRange === "1h"
                  ? "Data (Last 1 Hour)"
                  : `Data (${timeRange})`}
              </span>
            </div>
          </div>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center border border-white/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 size={24} className="text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Chart placeholder</p>
              <p className="text-gray-400 text-sm">
                {timeRange === "1h"
                  ? "Attendance trends (Last 1 Hour)"
                  : `Attendance trends (${timeRange})`}
              </p>
            </div>
          </div>
        </div>

        {/* Popular Sessions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Popular Sessions</h3>
            <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              Top 4
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                name: "Robotics & Automation Showcase",
                attendees: Math.floor(Math.random() * 200) + 100,
                color: "blue",
              },
              {
                name: "Sustainable Energy Projects",
                attendees: Math.floor(Math.random() * 200) + 100,
                color: "green",
              },
              {
                name: "Civil Engineering Innovations",
                attendees: Math.floor(Math.random() * 200) + 100,
                color: "purple",
              },
              {
                name: "Student Startup Pitches",
                attendees: Math.floor(Math.random() * 200) + 100,
                color: "orange",
              },
            ].map((session, i) => (
              <div
                key={i}
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-xl border border-white/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 bg-${session.color}-500 rounded-full`}
                  ></div>
                  <span className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                    {session.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {session.attendees}
                  </span>
                  <span className="text-xs text-gray-500">attendees</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewWidget;
