"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const CustomClock = () => {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set the initial date and time after the component mounts
    setCurrentDateTime(new Date());

    // Update the time every second
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  if (!currentDateTime) {
    // Render nothing or a placeholder during the initial render
    return null;
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    return date.toLocaleTimeString("en-US", options);
  };

  const getDayOfWeek = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col text-right items-end px-6"
    >
      <div className="text-lg font-semibold">
        {formatDate(currentDateTime)} | {getDayOfWeek(currentDateTime)}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="w-4 h-4 mr-1" />
        {formatTime(currentDateTime)}
      </div>
    </motion.div>
  );
};

export default CustomClock;
