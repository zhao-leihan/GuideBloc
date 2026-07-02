"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface RevenueChartProps {
  data: {
    label: string;
    bookings: number;
    subscriptions: number;
    boosts: number;
    tips: number;
  }[];
  type?: "bar" | "pie";
}

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];

export default function RevenueChart({ data, type = "bar" }: RevenueChartProps) {
  if (type === "pie") {
    const totals = [
      { name: "Bookings", value: data.reduce((s, d) => s + d.bookings, 0) },
      { name: "Subscriptions", value: data.reduce((s, d) => s + d.subscriptions, 0) },
      { name: "Boosts", value: data.reduce((s, d) => s + d.boosts, 0) },
      { name: "Tips", value: data.reduce((s, d) => s + d.tips, 0) },
    ].filter((d) => d.value > 0);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={totals}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {totals.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="bookings" name="Bookings" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
        <Bar dataKey="subscriptions" name="Subscriptions" fill="#10B981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="boosts" name="Boosts" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="tips" name="Tips" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
