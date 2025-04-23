"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivationOverviewProps {
  availableCount: number;
  redeemedCount: number;
  historicalData?: any[];
}

const COLORS = ["#0088FE", "#00C49F"];

const TrendIcon = ({ trend }: { trend: string }) => {
  switch (trend) {
    case "up":
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    case "down":
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    default:
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
  }
};

const SkeletonCard = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-[60px] mb-4" />
      <Skeleton className="h-[180px] w-full" />
    </CardContent>
  </Card>
);

export function ActivationOverview({
  availableCount,
  redeemedCount,
  historicalData = [],
}: ActivationOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const transformedData = historicalData.map((item) => ({
    date: format(new Date(item.date_purchased), "MMM dd"),
    available: item.amount,
    redeemed: item.redeemed_by ? item.amount : 0,
  }));

  const pieData = [
    { name: "Available", value: availableCount },
    { name: "Used", value: redeemedCount },
  ];

  const getTrend = (data: number[]) => {
    if (data.length < 2) return "neutral";
    const lastTwo = data.slice(-2);
    return lastTwo[1] > lastTwo[0] ? "up" : "down";
  };

  const availableTrend = getTrend(transformedData.map((d) => d.available));
  const redeemedTrend = getTrend(transformedData.map((d) => d.redeemed));

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Codes</CardTitle>
                  <TrendIcon trend={availableTrend} />
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl font-bold mb-2"
                  >
                    {availableCount}
                  </motion.div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transformedData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="available" fill="#0088FE" radius={[10, 10, 0, 0]}>
                          {transformedData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`rgba(0, 136, 254, ${(index + 1) * (1 / transformedData.length)})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Used Codes</CardTitle>
                  <TrendIcon trend={redeemedTrend} />
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl font-bold mb-2"
                  >
                    {redeemedCount}
                  </motion.div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transformedData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="redeemed" fill="#00C49F" radius={[10, 10, 0, 0]}>
                          {transformedData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`rgba(0, 196, 159, ${(index + 1) * (1 / transformedData.length)})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Activation Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
