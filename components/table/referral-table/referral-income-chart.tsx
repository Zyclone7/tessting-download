import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  amount: number;
}

interface ReferralIncomeChartProps {
  data: ChartData[];
}

const groupDataByDate = (data: ChartData[]): ChartData[] => {
  const grouped: { [date: string]: number } = {};

  // Group and sum amounts by date
  data.forEach(({ date, amount }) => {
    if (!grouped[date]) {
      grouped[date] = 0;
    }
    grouped[date] += amount;
  });

  // Convert the grouped data back into an array
  return Object.entries(grouped).map(([date, amount]) => ({
    date,
    amount,
  }));
};

export const ReferralIncomeChart: React.FC<ReferralIncomeChartProps> = ({
  data,
}) => {
  const groupedData = groupDataByDate(data); // Preprocess the data

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Referral Income Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};