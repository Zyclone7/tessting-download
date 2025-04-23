import { ReactNode } from "react";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
import UserDashboardLayout from "@/components/user-dashboard-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/hooks/use-user";

// async function verifyAuth() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("auth_token");
//   return !!token;
// }

export default async function UserDashboard({
  children,
}: {
  children: ReactNode;
}) {
  // const isAuthenticated = await verifyAuth();

  // if (!isAuthenticated) {
  //   redirect("/");
  // }

  return (
    <UserDashboardLayout>
      <TooltipProvider>
        <AuthGuard>{children}</AuthGuard>
      </TooltipProvider>
    </UserDashboardLayout>
  );
}
