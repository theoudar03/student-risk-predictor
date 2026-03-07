import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FaUserGraduate,
  FaExclamationCircle,
  FaShieldAlt,
  FaChartLine,
  FaBell,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    activeAlerts: 0,
  });
  const navigate = useNavigate();

  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const res = await axios.get("/api/attendance/stats/weekly");
      setGraphData(res.data);
    } catch (e) {
      console.error("Graph fetch error", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`/api/students/stats`);
      setStats(res.data);
    } catch (error) {
      console.error("Using fallback data");
      setStats({
        total: 450,
        highRisk: 28,
        mediumRisk: 65,
        lowRisk: 357,
        activeAlerts: 5,
      });
    }
  };

  const pieData = [
    { name: "Low Risk", value: stats.lowRisk, color: "#4BA258" },
    { name: "Medium Risk", value: stats.mediumRisk, color: "#FF9800" },
    { name: "High Risk", value: stats.highRisk, color: "#F72585" },
  ];

  const StatCard = ({ title, value, icon, color, bg, onClick }) => (
    <div
      className={`bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl p-6 shadow-sm h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            {title}
          </p>
          <h2 className="text-3xl font-bold text-gray-800 m-0">{value}</h2>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px]"
          style={{ background: bg, color: color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="font-bold text-2xl text-gray-800 mb-1">Overview</h2>
          <p className="text-gray-500 m-0 text-sm">Welcome back, Admin</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          onClick={() => window.location.reload()}
        >
          <FaChartLine /> Refresh Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={<FaUserGraduate />}
          color="#4361EE"
          bg="rgba(67, 97, 238, 0.1)"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={<FaBell />}
          color="#F72585"
          bg="rgba(247, 37, 133, 0.1)"
          onClick={() => navigate("/alerts")}
        />
        <StatCard
          title="High Risk"
          value={stats.highRisk}
          icon={<FaExclamationCircle />}
          color="#D00000"
          bg="rgba(208, 0, 0, 0.1)"
        />
        <StatCard
          title="Safe Zone"
          value={stats.lowRisk}
          icon={<FaShieldAlt />}
          color="#4BA258"
          bg="rgba(75, 162, 88, 0.1)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
        <div className="lg:col-span-7">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <h5 className="font-bold text-gray-800 text-lg mb-6">
              Avg Attendance Trend -{" "}
              {new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h5>
            <div className="h-[300px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      backgroundColor: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Attendance"
                    stroke="#4361EE"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-5">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <h5 className="font-bold text-gray-800 text-lg mb-6">Risk Distribution</h5>
            <div className="h-[250px] w-full m-auto flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={5}
                    cornerRadius={5}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '8px',
                      border: "none",
                      boxShadow: "0 4px 15px -3px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
