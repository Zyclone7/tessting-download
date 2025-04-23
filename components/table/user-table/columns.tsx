"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDate, formatNumber } from "@/lib/utils"
import { ArrowUpDown, Check, X, Mail, Phone, Building, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatUserRole } from "@/lib/utils"

// Define the user type based on the Prisma schema
export type UserType = {
  ID: number
  user_login: string
  user_nicename: string | null
  user_email: string | null
  user_contact_number: string | null
  user_url: string | null
  user_registered: Date | null
  user_status: number | null
  display_name: string | null
  user_role: string | null
  user_level: number | null
  user_upline_id: number | null
  user_credits: number | null
  user_referral_code: string | null
  user_referred_by_id: number | null
  user_kyc: number | null
  profile_pic_url: string | null
  travel_logo_url: string | null
  merchant_id: string | null
  business_name: string | null
  business_address: string | null
  travel_agency: string | null
  social_media_page: string | null
}

// Helper function to get initials from name
const getInitials = (name: string | null) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export const columns: ColumnDef<UserType>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       onClick={(e) => e.stopPropagation()}
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "ID",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("ID")}</div>,
  },
  {
    accessorKey: "user_nicename",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("user_nicename") as string | null
      const profilePic = row.original.profile_pic_url

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {profilePic ? <AvatarImage src={profilePic} alt={name || "User"} /> : null}
            <AvatarFallback className="bg-primary/10">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name || "Unnamed User"}</span>
            <span className="text-xs text-muted-foreground">{row.original.user_login}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "user_email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("user_email") as string | null
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{email || "—"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "user_contact_number",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.getValue("user_contact_number") as string | null
      return (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{contact || "—"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "user_role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const role = row.getValue("user_role") as string | null
      return (
        <Badge variant="outline" className="font-normal">
          {formatUserRole(role || "")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "merchant_id",
    header: "Merchant ID",
    cell: ({ row }) => {
      const merchantId = row.getValue("merchant_id") as string | null
      return merchantId ? (
        <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{merchantId}</div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "business_name",
    header: "Business",
    cell: ({ row }) => {
      const businessName = row.getValue("business_name") as string | null
      return businessName ? (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span>{businessName}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "user_credits",
    header: "Credits",
    cell: ({ row }) => {
      const credits = row.getValue("user_credits") as number | null
      return <div className="font-medium">{credits !== null ? formatNumber(credits) : "—"}</div>
    },
  },
  {
    accessorKey: "user_registered",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Registered
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("user_registered") as Date | null
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{date ? formatDate(date) : "—"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "user_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("user_status") as number | null

      if (status === 1) {
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      } else {
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <X className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
      }
    },
  },
]

