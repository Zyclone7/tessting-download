"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import {
  AirplayIcon,
  BookAIcon,
  CreditCardIcon as IdCardIcon,
  LayoutDashboard,
  LoaderCircleIcon,
  LogOut,
  MessageCircleQuestion,
  MessagesSquare,
  PlaneIcon,
  Settings,
  StoreIcon,
  User2,
  FileText,
} from "lucide-react";
import Logo from "@/public/images/logocircle.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/user-sidebar";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { useUserContext } from "@/hooks/use-user";
import Link from "next/link";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { getUserKYCStatus } from "@/actions/user";

// Sample data with updated icons, with subItems removed for Settings
const data = {
  navMain: [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      isActive: true,
      url: "/user-dashboard",
      requiresVerification: false,
    },
    {
      title: "KYC Verification",
      icon: IdCardIcon,
      isActive: true,
      url: "/user-dashboard/kyc",
      requiresVerification: true,
    },
    {
      icon: LoaderCircleIcon,
      isActive: true,
      title: "XpressLoad",
      url: "/user-dashboard/sell-voucher",
      requiresVerification: true,
    },
    {
      icon: PlaneIcon,
      isActive: true,
      title: "XpressTravels",
      url: "/user-dashboard/xpresstravels",
      requiresVerification: true,
    },
    {
      icon: StoreIcon,
      isActive: true,
      title: "XpressStore",
      url: "/user-dashboard/store",
      requiresVerification: true,
    },
    {
      icon: AirplayIcon,
      isActive: true,
      title: "Free Product",
      url: "/user-dashboard/free-product",
      requiresVerification: true,
    },
    {
      icon: BookAIcon,
      isActive: true,
      title: "E-Learnings",
      url: "#",
      requiresVerification: false,
    },
    {
      icon: HamburgerMenuIcon,
      isActive: true,
      title: "Security Logs",
      url: "#",
      requiresVerification: false,
    },
    {
      title: "Settings",
      icon: Settings,
      isActive: true,
      requiresVerification: false,
      url: "/user-dashboard/profile-edit",
      // Removed subItems for Settings
    },
  ],
};

const data2 = {
  navMain: [
    {
      title: "FAQ",
      icon: MessageCircleQuestion,
      isActive: true,
      url: "#",
      requiresVerification: false,
    },
    {
      title: "Contact Us",
      icon: MessagesSquare,
      isActive: true,
      url: "#",
      requiresVerification: false,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUserContext();
  const pathname = usePathname();
  const [kycStatus, setKycStatus] = useState<string>("0");

  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: "/avatars/default-avatar.png",
        status: user.status || 0,
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        avatar: "/avatars/default-avatar.png",
        status: 0,
      };

  const router = useRouter();
  const { clearUser } = useUserContext();

  // State to track which item is active
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Toggle the active state of a menu item
  const toggleItem = (itemTitle: string) => {
    setActiveItem((prevState) => (prevState === itemTitle ? null : itemTitle));
  };

  // Auto-open parent menu when subitem is active (won't affect Settings now)
  // useEffect(() => {
  //   data.navMain.forEach((item) => {
  //     if (item.subItems) {
  //       const hasActiveSubItem = item.subItems.some(
  //         (subItem) => subItem.url === pathname
  //       );
  //       if (hasActiveSubItem) setActiveItem(item.title);
  //     }
  //   });
  // }, [pathname]);

  // Fetch KYC status
  useEffect(() => {
    const fetchKYCStatus = async () => {
      if (user) {
        try {
          const response = await getUserKYCStatus(user.id.toString());
          if (response.success && typeof response.data === "number") {
            setKycStatus(response.data.toString());
          } else {
            setKycStatus("0");
          }
        } catch (error) {
          setKycStatus("0");
        }
      }
    };

    fetchKYCStatus();
  }, [user]);

  const handleLogout = () => {
    clearUser();
    router.push("/login");
  };

  // Check if the user is verified (status is not 0 or kycStatus is "1")
  const isUserVerified = userData.status !== 0 || kycStatus === "1";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-center items-center h-full w-full">
              <img
                src={Logo.src || "/placeholder.svg"}
                alt="Logo"
                className="flex justify-center items-center h-auto w-auto max-h-44 object-contain hover:scale-105 transition-transform duration-200 ease-in-out rounded-full md:h-60 md:w-auto md:max-h-44 md:object-contain md:hover:scale-105 md:transition-transform md:duration-200 md:ease-in-out group-data-[collapsible=icon]:hidden"
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="justify-between">
        <SidebarGroup>
          <SidebarMenu>
            <div className="mt-3">
              {data.navMain
                .filter((item) => {
                  const isKycItem = item.title.toLowerCase().includes("kyc");
                  const hideKyc = kycStatus === "1";
                  return isKycItem ? !hideKyc : true;
                })
                .map((item) => {
                  const isDisabled =
                    item.requiresVerification && !isUserVerified;
                  return (
                    <SidebarMenuItem key={item.title}>
                      {isDisabled ? (
                        <div
                          className="flex items-center gap-6 py-6 px-2 transition-colors duration-200 opacity-50 cursor-not-allowed"
                          title="Complete KYC verification to access this feature"
                        >
                          {item.icon && <item.icon className="w-5 h-5" />}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "flex items-center gap-6 py-6 px-2 transition-colors duration-200",
                            pathname === item.url &&
                              "bg-white shadow-md text-[#1A5EA2] font-bold"
                          )}
                          onClick={() => toggleItem(item.title)}
                        >
                          <Link
                            href={item.url}
                            className="font-medium flex items-center gap-3 w-full"
                          >
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
            </div>

            <div className="mt-10">
              {data2.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`flex items-center gap-4 py-3 px-4 transition-colors duration-200 ${
                      activeItem === item.title
                        ? "bg-white shadow-md text-[#1A5EA2] font-bold"
                        : ""
                    }`}
                    onClick={() => toggleItem(item.title)}
                  >
                    <Link
                      href={item.url}
                      className="font-medium flex items-center gap-3 w-full"
                    >
                      {item.icon && <item.icon className="w-5 h-5" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>

            <div className="p-2">
              <button
                className={cn(
                  "cursor-pointer w-full justify-between text-lg font-bold text-center bg-white text-[#1A5EA2] rounded-lg py-2 px-4 hover:bg-opacity-90 transition-all duration-200",
                  "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0"
                )}
                onClick={handleLogout}
              >
                <span className="group-data-[collapsible=icon]:hidden">
                  Logout
                </span>
                <LogOut className="hidden group-data-[collapsible=icon]:block w-4 h-4 mx-auto" />
              </button>
            </div>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
