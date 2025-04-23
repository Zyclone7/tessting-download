"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import CustomClock from "@/components/clock"

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b justify-between px-4 pr-0 mr-0 bg-white ${isScrolled ? "shadow-sm" : ""
            } transition-shadow duration-200`}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-[#3c89d6] hover:text-[#3c89d6]/80 transition-colors" />
          </div>
          <CustomClock />
        </motion.header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default UserDashboardLayout

