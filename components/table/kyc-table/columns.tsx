"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { CheckCircle2, XCircle, Clock, MoreHorizontal, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const statusLower = status?.toLowerCase()

  if (statusLower === "approved") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </Badge>
    )
  }

  if (statusLower === "rejected") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Rejected
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  )
}

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "user_id",
    header: "User ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("user_id")}</div>,
  },
  {
    accessorKey: "user_info",
    header: "User",
    cell: ({ row }) => {
      const user = row.getValue("user_info") as any
      const name = user?.user_nicename || user?.display_name || "Unknown User"
      const email = user?.user_email || "No email"
      const profilePic = user?.profile_pic_url

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={profilePic || "/placeholder.svg"} alt={name} className="object-cover" />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">{email}</div>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const user = row.getValue(id) as any
      return (
        user?.display_name?.toLowerCase().includes(value.toLowerCase()) ||
        user?.user_email?.toLowerCase().includes(value.toLowerCase())
      )
    },
  },
  {
    accessorKey: "business_info",
    header: "Business",
    cell: ({ row }) => {
      const user = row.getValue("user_info") as any
      const businessName = user?.business_name || "N/A"

      return (
        <div className="flex flex-col">
          <div className="font-medium">{businessName}</div>
          {user?.merchant_id && <div className="text-xs text-muted-foreground">ID: {user.merchant_id}</div>}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("status")),
    filterFn: (row, id, value) => {
      return value === "all" || (row.getValue(id) as string).toLowerCase() === value.toLowerCase()
    },
  },
  {
    accessorKey: "date_submitted",
    header: "Submitted",
    cell: ({ row }) => {
      const date: any = row.getValue("date_submitted")
      if (!date) return <div className="text-muted-foreground">N/A</div>

      const formatted = format(new Date(date), "MMM d, yyyy")
      return <div className="whitespace-nowrap">{formatted}</div>
    },
  },
  {
    accessorKey: "date_approve_denied",
    header: "Decision Date",
    cell: ({ row }) => {
      const date: any = row.getValue("date_approve_denied")
      if (!date) return <div className="text-muted-foreground">Pending</div>

      const formatted = format(new Date(date), "MMM d, yyyy")
      return <div className="whitespace-nowrap">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const kyc = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                window.open(kyc.valid_id_url, "_blank")
              }}
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                window.open(kyc.selfie_pic_url, "_blank")
              }}
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Selfie
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
