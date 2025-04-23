import React from 'react'
import { AppSidebar } from './app-sidebar'
import { SidebarInset, SidebarProvider } from './ui/sidebar'

const AdminDashboardLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminDashboardLayout