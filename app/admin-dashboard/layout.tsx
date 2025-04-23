import { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";

export default function UserDashboard({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <AdminDashboardLayout>
      <TooltipProvider>{children}</TooltipProvider>
    </AdminDashboardLayout>
  );
}
