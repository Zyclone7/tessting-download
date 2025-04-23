import { Transaction } from "@/types/types";
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// const formatNumber = (num: number): string => {
//   return num.toLocaleString('en-US');
// };

export function formatNumber(num?: number): string {
  if (num === undefined || num === null || isNaN(num)) {
    return "N/A";
  }
  return num.toLocaleString("en-US");
}

export const sortTransactions = (
  transactions: Transaction[],
  sortBy: "date" | "amount" = "date"
) => {
  return [...transactions].sort((a, b) => {
    if (sortBy === "date") {
      return b.date.getTime() - a.date.getTime();
    }
    return b.amount - a.amount;
  });
};

export function generateOTP(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy h:mm a");
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export const formatUserRole = (role: string) => {
  if (!role) return "";

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace("Package", "");
};


export function generateRandomPassword(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export const getRoleBadgeStyle = (role: string) => {
  const baseStyle = "text-white px-2 py-1 text-sm font-semibold rounded-2xl";
  switch (role) {
    case "Premium_Merchant_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`;
    case "Basic_Merchant_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#020024,_#6de7f7,_#00d4ff)]`;
    case "Elite_Distributor_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#1D6DBB,_#145998,_#0B4674,_#023251)]`;
    case "Elite_Plus_Distributor_Package":
      return `${baseStyle} bg-[linear-gradient(to_right,_#3D89D6,_#1A5EA2,_#0B4674,_#023251)]`;
    case "Admin":
      return `${baseStyle} bg-gradient-to-r from-red-400 to-red-600`;
    default:
      return `${baseStyle} bg-gradient-to-r from-gray-400 to-gray-600`;
  }
};

export const getDayOfWeek = (date: Date) => {
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