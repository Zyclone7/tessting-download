/**
 * Calculates the time difference between a date and now
 * @param date The date to compare with now
 * @returns A formatted string representing the time difference
 */
export function getTimeSince(date: Date | null): string {
  if (!date) return "N/A";

  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();

  // Convert to seconds, minutes, hours, days
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInMonths / 12);

  // Format the time difference in a detailed way
  if (diffInYears > 0) {
    const remainingMonths = diffInMonths % 12;
    if (remainingMonths > 0) {
      return `${diffInYears} year${
        diffInYears > 1 ? "s" : ""
      }, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
    }
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""}`;
  }

  if (diffInMonths > 0) {
    const remainingDays = diffInDays % 30;
    if (remainingDays > 0) {
      return `${diffInMonths} month${
        diffInMonths > 1 ? "s" : ""
      }, ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
    }
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""}`;
  }

  if (diffInDays > 0) {
    const remainingHours = diffInHours % 24;
    if (remainingHours > 0) {
      return `${diffInDays} day${
        diffInDays > 1 ? "s" : ""
      }, ${remainingHours} hour${remainingHours > 1 ? "s" : ""}`;
    }
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
  }

  if (diffInHours > 0) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffInHours} hour${
        diffInHours > 1 ? "s" : ""
      }, ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}`;
    }
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""}`;
  }

  if (diffInMinutes > 0) {
    const remainingSeconds = diffInSeconds % 60;
    if (remainingSeconds > 0) {
      return `${diffInMinutes} minute${
        diffInMinutes > 1 ? "s" : ""
      }, ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;
    }
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""}`;
  }

  return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""}`;
}

/**
 * Formats a date to a readable string
 * @param date The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
