import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";

export default function Reports({ records }) {
  // Bookings per employee
  const bookingsPerEmployee = useMemo(() => {
    const counts = {};
    records.forEach((r) => {
      counts[r.name] = (counts[r.name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [records]);

  // Vacation vs Travel
  const typeBreakdown = useMemo(() => {
    const counts = { Vacation: 0, Travel: 0 };
    records.forEach((r) => counts[r.type]++);
    return Object.entries(counts).map(([type, value]) => ({ type, value }));
  }, [records]);

  // Monthly distribution
  const monthlyDistribution = useMemo(() => {
    const counts = {};
    records.forEach((r) => {
      if (!r.start) return;
      const month = format(new Date(r.start), "MMM yyyy");
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([month, value]) => ({ month, value }));
  }, [records]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-8 transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 dark:text-gray-200">Reports 📊</h2>

      {/* Bookings per Employee */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3 dark:text-gray-200">
          Bookings per Employee
        </h3>
        <BarChart width={800} height={300} data={bookingsPerEmployee}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" hide />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" name="Bookings" />
        </BarChart>
      </div>

      {/* Vacation vs Travel */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3 dark:text-gray-200">
          Vacation vs Travel
        </h3>
        <PieChart width={400} height={300}>
          <Pie
            data={typeBreakdown}
            dataKey="value"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#82ca9d"
            label
          >
            {typeBreakdown.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === "Vacation" ? "#22c55e" : "#3b82f6"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* Monthly Distribution */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3 dark:text-gray-200">
          Monthly Distribution of Bookings
        </h3>
        <LineChart width={800} height={300} data={monthlyDistribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </div>
    </div>
  );
}
