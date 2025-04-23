"use client";

import { useState, useEffect } from "react";
import RegisteredUsersTable from "@/components/registered-users-table/registered-users-table";
import { useUserContext } from "@/hooks/use-user";

const UserDashboardLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useUserContext();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-gray-900">
      {/* Header Section */}
      <header></header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Registered Users</h1>
          </div>
          <RegisteredUsersTable userId={user?.id ? user?.id : 0} />
        </div>
      </main>

      {/* Footer Section */}
      <footer className="py-6 text-center"></footer>
    </div>
  );
};

export default UserDashboardLayout;