"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useUserContext } from "@/hooks/use-user";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserNavigationProps {
  isScrolled?: boolean;
}

export function NavigationMenuDemo({ isScrolled }: UserNavigationProps) {
  const router = useRouter();
  const { clearUser, user } = useUserContext();

  const components = [
    {
      title: "Sell Products",
      path: `/user-dashboard/sell-voucher`,
      description:
        "Facilitate the selling of various vouchers through a streamlined interface.",
    },
    {
      title: "Sold Products",
      path: `/user-dashboard/sold-voucher`,
      description:
        "View details of vouchers that have already been sold, including transaction information.",
    },
  ];

  const handleLogout = () => {
    router.push("/login");
    clearUser(); // Clear user data and token
    
  };

  const renderListItem = (href: string, title: string, description: string) => (
    <ListItem href={href} title={title}>
      {description}
    </ListItem>
  );

  const isDisabled = user?.status === 0;

  return (
    <NavigationMenu className="w-full max-w-full md:max-w-none">
      <NavigationMenuList className="flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
        {/* Navigation Section */}
        <NavigationMenuItem className="w-full md:w-auto">
          <Link
            href={isDisabled ? "#" : "/user-dashboard"}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "w-full md:w-auto justify-between",
                isDisabled && "pointer-events-none opacity-50"
              )}
              aria-disabled={isDisabled}
            >
              <p className="font-bold">Dashboard</p>
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* XpressLoad Section */}
        <NavigationMenuItem className="w-full md:w-auto">
          <Link
            href={isDisabled ? "#" : "/user-dashboard/sell-voucher"}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "w-full md:w-auto justify-between",
                isDisabled && "pointer-events-none opacity-50"
              )}
              aria-disabled={isDisabled}
            >
              <p className="font-bold">Xpress Load</p>
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* XpressTravels Section */}
        <NavigationMenuItem className="w-full md:w-auto">
          <Link
            href={isDisabled ? "#" : "/user-dashboard/xpresstravels"}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "w-full md:w-auto justify-between",
                isDisabled && "pointer-events-none opacity-50"
              )}
              aria-disabled={isDisabled}
            >
              <p className="font-bold">Xpress Travels</p>
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Store Section */}
        <NavigationMenuItem className="w-full md:w-auto">
          <Link
            href={isDisabled ? "#" : "/user-dashboard/store"}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "w-full md:w-auto justify-between",
                isDisabled && "pointer-events-none opacity-50"
              )}
              aria-disabled={isDisabled}
            >
              <p className="font-bold">Xpress Store</p>
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Settings Section */}
        <NavigationMenuItem className="w-full md:w-auto">
          <Link
            href={isDisabled ? "#" : "/user-dashboard/profile-edit"}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "w-full md:w-auto justify-between",
                isDisabled && "pointer-events-none opacity-50"
              )}
              aria-disabled={isDisabled}
            >
              <p className="font-bold">Settings</p>
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Logout Button */}
        <NavigationMenuItem className="w-full md:w-auto">
          <button
            className={cn(
              navigationMenuTriggerStyle(),
              "cursor-pointer w-full md:w-auto justify-between"
            )}
            onClick={handleLogout}
          >
            <p className="font-bold">Log Out</p>
          </button>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { href: string }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          href={href}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";