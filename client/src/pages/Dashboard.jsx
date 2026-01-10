import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Button } from "react-bootstrap";
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
      className="glass-card h-100"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <p className="text-muted small fw-bold text-uppercase mb-1">
            {title}
          </p>
          <h2 className="fw-bold mb-0">{value}</h2>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: bg,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold fs-3 mb-1">Overview</h2>
          <p className="text-muted mb-0">Welcome back, Admin</p>
        </div>
        <Button
          variant="outline-primary"
          onClick={() => window.location.reload()}
          size="sm"
        >
          <FaChartLine className="me-2" /> Refresh Dashboard
        </Button>
      </div>

      <Row className="g-3">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Students"
            value={stats.total}
            icon={<FaUserGraduate />}
            color="#4361EE"
            bg="rgba(67, 97, 238, 0.1)"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={<FaBell />}
            color="#F72585"
            bg="rgba(247, 37, 133, 0.1)"
            onClick={() => navigate("/alerts")}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="High Risk"
            value={stats.highRisk}
            icon={<FaExclamationCircle />}
            color="#D00000"
            bg="rgba(208, 0, 0, 0.1)"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Safe Zone"
            value={stats.lowRisk}
            icon={<FaShieldAlt />}
            color="#4BA258"
            bg="rgba(75, 162, 88, 0.1)"
          />
        </Col>
      </Row>

      <Row className="mt-2 g-3">
        <Col xs={12} lg={7}>
          <div className="glass-card h-100">
            <h5 className="mb-4 fw-bold">
              Avg Attendance Trend -{" "}
              {new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h5>
            <div style={{ height: 300, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eee"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
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
        </Col>
        <Col xs={12} lg={5}>
          <div className="glass-card h-100">
            <h5 className="mb-4 fw-bold">Risk Distribution</h5>
            <div style={{ height: 250, width: "100%" }}>
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
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
