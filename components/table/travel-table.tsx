"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import {
  IconColumns,
  IconFileTypeCsv,
  IconDownload,
  IconFilter,
  IconSearch,
  IconRefresh,
  IconChartBar,
  IconCalendarStats,
  IconUsers,
  IconCurrencyDollar,
  IconSend,
  IconPrinter,
  IconDotsVertical,
} from "@tabler/icons-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CSVLink } from "react-csv"
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Loader2, Eye, FileText, AlertTriangle, CheckCircle, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import * as Slider from "@radix-ui/react-slider"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUserContext } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { motion, AnimatePresence } from "framer-motion"
import { getAllTravel, updateBookingStatus, getAirportById, getBookingStats } from "@/actions/booking"
import { getUserByUuid } from "@/actions/user"
import Image from "next/image"
import { pdf } from "@react-pdf/renderer"
import ItineraryDocument from "@/components/itinerary_document"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Import chart components
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"

interface Props {
  setViewVoucher: (voucher: any) => void
  onRefresh: () => void
}

export default function TravelTable({ setViewVoucher, onRefresh }: Props) {
  // State management
  const [voucherData, setVoucherData] = useState<any[]>([])
  const [currentVoucherId, setCurrentVoucherId] = useState<number>(0)
  const [ifEditing, setIfEditing] = useState<boolean>(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
  const [selectedDateField, setSelectedDateField] = useState<"date_booked_request" | "departure_date">(
    "date_booked_request",
  )
  const [travelTypes, setTravelTypes] = useState<string[]>([])
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 100000])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { user } = useUserContext()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isConfirmRejectDialogOpen, setIsConfirmRejectDialogOpen] = useState(false)
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [remarks, setRemarks] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [statsData, setStatsData] = useState<any>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [quickViewBooking, setQuickViewBooking] = useState<any>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [dateFilterPreset, setDateFilterPreset] = useState<string>("all")

  // Memoized status options for filtering
  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All Statuses" },
      { value: "Pending", label: "Pending" },
      { value: "Generated", label: "Generated" },
      { value: "Rejected", label: "Rejected" },
    ],
    [],
  )

  // Date filter presets
  const dateFilterPresets = useMemo(
    () => [
      { value: "all", label: "All Time" },
      { value: "today", label: "Today" },
      { value: "yesterday", label: "Yesterday" },
      { value: "thisWeek", label: "This Week" },
      { value: "lastWeek", label: "Last Week" },
      { value: "thisMonth", label: "This Month" },
      { value: "lastMonth", label: "Last Month" },
      { value: "custom", label: "Custom Range" },
    ],
    [],
  )

  // Apply date filter preset
  const applyDateFilterPreset = useCallback((preset: string) => {
    const today = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case "today":
        from = today
        to = today
        break
      case "yesterday":
        from = subDays(today, 1)
        to = subDays(today, 1)
        break
      case "thisWeek":
        from = startOfDay(subDays(today, today.getDay()))
        to = today
        break
      case "lastWeek":
        from = startOfDay(subDays(today, today.getDay() + 7))
        to = subDays(today, today.getDay() + 1)
        break
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = today
        break
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case "all":
      default:
        from = undefined
        to = undefined
        break
    }

    if (from && to) {
      setDateRange({ from, to })
    } else {
      setDateRange(undefined)
    }

    setDateFilterPreset(preset)
  }, [])

  // Optimized data fetching with caching and error handling
  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);

    try {
      // Run travel data and stats fetch in parallel
      const [travelResult, statsResult] = await Promise.all([
        getAllTravel(),
        getBookingStats()
      ]);

      // Process travel data
      if (travelResult.success && travelResult.data) {
        // Group bookings by merchant ID to reduce API calls
        const bookingsByMerchant: Record<string, any[]> = {};
        travelResult.data.forEach(booking => {
          if (booking.uid) {
            const uid = String(booking.uid);
            if (!bookingsByMerchant[uid]) {
              bookingsByMerchant[uid] = [];
            }
            bookingsByMerchant[uid].push(booking);
          }
        });

        // Fetch merchant info once per unique merchant
        const merchantPromises = Object.keys(bookingsByMerchant).map(async (uid) => {
          try {
            const merchantResult = await getUserByUuid(uid);
            const merchantName = merchantResult.success && merchantResult.data
              ? merchantResult.data.user_nicename || merchantResult.data.display_name || "Unknown"
              : "Unknown";

            // Update all bookings with this merchant ID
            bookingsByMerchant[uid].forEach(booking => {
              booking.merchant_name = merchantName;
            });
          } catch (error) {
            console.error(`Error fetching merchant ${uid}:`, error);
            // If fetch fails, set default name
            bookingsByMerchant[uid].forEach(booking => {
              booking.merchant_name = "Unknown";
            });
          }
        });

        // Wait for all merchant info to be fetched
        await Promise.all(merchantPromises);

        // Create flat array of all enhanced bookings
        const enhancedBookings = Object.values(bookingsByMerchant).flat();

        // Add any bookings without merchant IDs
        travelResult.data
          .filter(booking => !booking.uid)
          .forEach(booking => {
            booking.merchant_name = "No Merchant";
            enhancedBookings.push(booking);
          });

        // Set the enhanced data
        setVoucherData(enhancedBookings);
        setFilteredData(enhancedBookings);
      } else {
        setVoucherData([]);
        setFilteredData([]);

        if (!travelResult.success) {
          setError(travelResult.error || "An error occurred while fetching data");
          toast({
            title: "Error",
            description: travelResult.error || "Failed to load booking data",
            variant: "destructive",
          });
        }
      }

      // Process stats data
      if (statsResult.success) {
        setStatsData(statsResult.data);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("An error occurred while fetching data");
      toast({
        title: "Error",
        description: "Failed to load booking data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setIsRefreshing(false);
      }, 500);
    }
  }, [toast]);

  // Helper function to enhance booking with merchant info
  const enhanceBookingWithMerchantInfo = async (booking: any) => {
    if (booking.uid) {
      try {
        const uuidStr = String(booking.uid)
        const merchantResult = await getUserByUuid(uuidStr)
        if (merchantResult.success && merchantResult.data) {
          return {
            ...booking,
            merchant_name: merchantResult.data.user_nicename || merchantResult.data.display_name || "Unknown",
          }
        }
      } catch (err) {
        console.error("Error fetching merchant info:", err)
      }
    }
    return booking
  }

  // Initial data load
  useEffect(() => {
    fetchData()
    setIsClient(true)
  }, [fetchData])

  // Apply filters when status filter changes
  useEffect(() => {
    applyFilters()
  }, [statusFilter, searchQuery, voucherData, activeTab])

  // Apply all filters to the data
  const applyFilters = useCallback(() => {
    if (!voucherData.length) return

    let filtered = [...voucherData]

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((item) => item.status === activeTab)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          (item.reference_no && item.reference_no.toLowerCase().includes(query)) ||
          (item.pnr && item.pnr.toLowerCase().includes(query)) ||
          (item.first_name && item.first_name.toLowerCase().includes(query)) ||
          (item.last_name && item.last_name.toLowerCase().includes(query)) ||
          (item.email_client && item.email_client.toLowerCase().includes(query)) ||
          (item.email_merchant && item.email_merchant.toLowerCase().includes(query)) ||
          (item.merchant_name && item.merchant_name.toLowerCase().includes(query)),
      )
    }

    setFilteredData(filtered)
  }, [voucherData, statusFilter, searchQuery, activeTab])

  // Apply advanced filters
  const applyAdvancedFilters = useCallback(() => {
    if (!voucherData.length) return

    const filtered = voucherData.filter((item) => {
      // Date filtering
      let isInDateRange = true
      if (dateRange?.from) {
        const itemDate = item[selectedDateField] ? new Date(item[selectedDateField]) : null
        if (itemDate) {
          isInDateRange = isWithinInterval(itemDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to || dateRange.from),
          })
        } else {
          isInDateRange = false
        }
      }

      // Travel type filtering
      const matchesTravelType = travelTypes.length === 0 || travelTypes.includes(item.type_of_travel || "")

      // Amount range filtering
      const itemPrice = Number.parseFloat(item.selling_price || "0")
      const isInAmountRange = itemPrice >= amountRange[0] && itemPrice <= amountRange[1]

      return isInDateRange && matchesTravelType && isInAmountRange
    })

    setFilteredData(filtered)
    setIsFilterPopoverOpen(false)

    toast({
      title: "Filters Applied",
      description: `Showing ${filtered.length} of ${voucherData.length} bookings`,
    })
  }, [voucherData, dateRange, selectedDateField, travelTypes, amountRange, toast])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setGlobalFilter("")
    setDateRange(undefined)
    setSelectedDateField("date_booked_request")
    setTravelTypes([])
    setAmountRange([0, 100000])
    setStatusFilter("all")
    setSearchQuery("")
    setDateFilterPreset("all")
    setFilteredData(voucherData)
    setActiveTab("all")

    toast({
      title: "Filters Reset",
      description: "All filters have been cleared",
    })
  }, [voucherData, toast])

  // Handle row click to view booking details
  const handleRowClick = useCallback(
    (voucher: any, rowIndex: number) => {
      setViewVoucher(voucher)
      setCurrentVoucherId(rowIndex)
      setIfEditing(false)
      setIsDialogOpen(true)
    },
    [setViewVoucher],
  )

  // Handle quick view
  const handleQuickView = useCallback((booking: any) => {
    setQuickViewBooking(booking)
    setIsQuickViewOpen(true)
  }, [])

  // Handle travel type filter changes
  const handleTravelTypeChange = useCallback((type: string) => {
    setTravelTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  // Handle amount range changes
  const handleAmountRangeChange = useCallback((value: number[]) => {
    setAmountRange([value[0], value[1]])
  }, [])

  // Handle date range changes
  const handleDateChange = useCallback((newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange)
    if (newDateRange) {
      setDateFilterPreset("custom")
    }
  }, [])

  // Handle date field selection changes
  const handleDateFieldChange = useCallback((value: string) => {
    if (value === "date_booked_request" || value === "departure_date") {
      setSelectedDateField(value as "date_booked_request" | "departure_date")
    }
  }, [])

  // Handle row selection
  const handleRowSelectionChange = useCallback((id: string) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  // Handle select all rows
  const handleSelectAllRows = useCallback(() => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredData.map((item) => item.id.toString()))
    }
  }, [filteredData, selectedRows.length])

  // Handle bulk actions
  const handleBulkAction = useCallback(
    (action: "generate" | "reject") => {
      if (selectedRows.length === 0) {
        toast({
          title: "No Bookings Selected",
          description: "Please select at least one booking to perform this action.",
          variant: "destructive",
        })
        return
      }

      if (action === "generate") {
        toast({
          title: "Bulk Generate",
          description: `Generating itineraries for ${selectedRows.length} bookings...`,
        })
        // Implement bulk generate logic here
      } else if (action === "reject") {
        toast({
          title: "Bulk Reject",
          description: `Rejecting ${selectedRows.length} bookings...`,
        })
        // Implement bulk reject logic here
      }
    },
    [selectedRows, toast],
  )

  // Generate PDF for itinerary
  const generateItineraryPDF = useCallback(async (booking: any): Promise<{ success: boolean; url?: string }> => {
    try {
      // Fetch airport data in parallel
      const airportRequests: Promise<any>[] = []
      const airports: any = {}

      if (booking.departure_airport_id) {
        airportRequests.push(
          getAirportById(booking.departure_airport_id).then((res) => {
            if (res.success) airports.departure = res.data
          }),
        )
      }

      if (booking.destination_airport_id) {
        airportRequests.push(
          getAirportById(booking.destination_airport_id).then((res) => {
            if (res.success) airports.destination = res.data
          }),
        )
      }

      if (booking.return_departure_airport_id) {
        airportRequests.push(
          getAirportById(booking.return_departure_airport_id).then((res) => {
            if (res.success) airports.returnDeparture = res.data
          }),
        )
      }

      if (booking.return_destination_airport_id) {
        airportRequests.push(
          getAirportById(booking.return_destination_airport_id).then((res) => {
            if (res.success) airports.returnDestination = res.data
          }),
        )
      }
      // Get merchant info for the travel logo URL
      let travelLogoUrl = null;

      if (booking.uid) {
        try {
          const merchantResult = await getUserByUuid(booking.uid.toString());
          if (merchantResult.success && merchantResult.data) {
            travelLogoUrl = merchantResult.data.travel_logo_url || null;
          }
        } catch (error) {
          console.error("Error fetching merchant data for logo:", error);
        }
      }

      await Promise.all(airportRequests)

      // Generate PDF with airport data
      const blob = await pdf(<ItineraryDocument booking={booking} airports={airports} travelLogoUrl={travelLogoUrl} />).toBlob()
      const pdfUrl = URL.createObjectURL(blob)
      return { success: true, url: pdfUrl }
    } catch (error) {
      console.error("Error generating PDF:", error)
      return { success: false }
    }
  }, [])

  // Send itinerary email
  const sendItineraryEmail = useCallback(
    async (clientEmail: string, pdfUrl: string): Promise<{ success: boolean }> => {
      try {
        // Get the current booking with merchant data
        const currentBooking = filteredData[currentVoucherId];

        // You might want to also fetch the latest merchant data here
        let travelLogoUrl = null;
        if (currentBooking.uid) {
          try {
            const merchantResult = await getUserByUuid(currentBooking.uid.toString());
            if (merchantResult.success && merchantResult.data && merchantResult.data.travel_logo_url) {
              travelLogoUrl = merchantResult.data.travel_logo_url;
            }
          } catch (error) {
            console.error("Error fetching merchant data for logo:", error);
          }
        }

        // Send email with PDF and travel logo info
        const response = await fetch("/api/send-itinerary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking: currentBooking,
            pdfUrl,
            travelLogoUrl // Include the logo URL in the API request
          }),
        });

        const result = await response.json();
        return { success: result.success };
      } catch (error) {
        console.error("Error sending itinerary email:", error);
        return { success: false };
      }
    },
    [filteredData, currentVoucherId]
  );

  const handleConfirmGenerateItinerary = useCallback(async () => {
    if (!filteredData[currentVoucherId]) {
      toast({
        title: "Error",
        description: "No booking selected.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingItinerary(true);

    try {
      // Get the current booking data - create a copy to avoid modifying the original
      const currentBooking = { ...filteredData[currentVoucherId] };

      // Ensure we have the latest merchant data for the logo
      if (currentBooking.uid) {
        try {
          const merchantResult = await getUserByUuid(currentBooking.uid.toString());
          if (merchantResult.success && merchantResult.data) {
            // Update the booking with more merchant data if needed
            currentBooking.travel_logo_url = merchantResult.data.travel_logo_url;
            currentBooking.travel_agency = merchantResult.data.travel_agency || currentBooking.travel_agency;
            currentBooking.business_name = merchantResult.data.business_name || currentBooking.business_name;
            currentBooking.social_media_page = merchantResult.data.social_media_page || currentBooking.social_media_page;
          }
        } catch (error) {
          console.error("Error fetching merchant data:", error);
        }
      }

      // Generate the itinerary PDF
      const pdfResult = await generateItineraryPDF(currentBooking);

      if (!pdfResult.success || !pdfResult.url) {
        toast({
          title: "Error",
          description: "Failed to generate itinerary PDF. Please try again.",
          variant: "destructive",
        });
        setIsGeneratingItinerary(false);
        return;
      }

      // Update booking status with PDF URL
      const currentDate = new Date().toISOString();
      const result = await updateBookingStatus(
        currentBooking.id,
        "Generated",
        currentDate,
        pdfResult.url,
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Itinerary generated successfully.",
        });

        // Update local data
        const updatedData = voucherData.map((booking) =>
          booking.id === currentBooking.id
            ? {
              ...booking,
              status: "Generated",
              date_generated_rejected: currentDate,
              pdf_url: pdfResult.url,
            }
            : booking,
        );

        setVoucherData(updatedData);
        applyFilters();

        // Close the confirm dialog
        setIsConfirmDialogOpen(false);

        // Show the preview dialog
        setPdfUrl(pdfResult.url);
        setIsPreviewDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update booking status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingItinerary(false);
    }
  }, [filteredData, currentVoucherId, generateItineraryPDF, toast, voucherData, applyFilters]);

  // Handle send email
  const handleSendEmail = useCallback(async () => {
    if (!filteredData[currentVoucherId] || !pdfUrl) return

    setIsSendingEmail(true)

    try {
      const emailResult = await sendItineraryEmail(filteredData[currentVoucherId].email_client, pdfUrl)

      if (emailResult.success) {
        toast({
          title: "Email Sent",
          description: "Itinerary PDF has been sent to the client's email address.",
        })

        // Close dialogs and refresh data
        setIsPreviewDialogOpen(false)
        setIsConfirmDialogOpen(false)
        setIsDialogOpen(false)
        onRefresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to send itinerary email. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the email.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }, [filteredData, currentVoucherId, pdfUrl, sendItineraryEmail, toast, onRefresh])

  // Handle close preview
  const handleClosePreview = useCallback(() => {
    setIsPreviewDialogOpen(false)
    setIsDialogOpen(false)
    URL.revokeObjectURL(pdfUrl || "") // Clean up the blob URL
    setPdfUrl(null)
    onRefresh() // Refresh data after closing
  }, [pdfUrl, onRefresh])

  // Handle reject booking
  const handleReject = useCallback(() => {
    if (!remarks.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }
    setIsRejectDialogOpen(false)
    setIsConfirmRejectDialogOpen(true)
  }, [remarks, toast])

  // Confirm reject booking
  const confirmReject = useCallback(async () => {
    if (!filteredData[currentVoucherId]) {
      toast({
        title: "Error",
        description: "No booking selected.",
        variant: "destructive",
      })
      return
    }

    try {
      const currentDate = new Date().toISOString()
      const result = await updateBookingStatus(filteredData[currentVoucherId].id, "Rejected", currentDate, remarks)

      if (result.success) {
        toast({
          title: "Booking Rejected",
          description: "The booking status has been updated to Rejected.",
        })

        // Update local data
        const updatedData = voucherData.map((booking) =>
          booking.id === filteredData[currentVoucherId].id
            ? {
              ...booking,
              status: "Rejected",
              date_generated_rejected: currentDate,
              reason_of_rejected: remarks,
            }
            : booking,
        )

        setVoucherData(updatedData)
        applyFilters()

        setIsConfirmRejectDialogOpen(false)
        setIsDialogOpen(false)
        onRefresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to update booking status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting booking:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }, [filteredData, currentVoucherId, remarks, toast, voucherData, applyFilters, onRefresh])

  // Calculate statistics for dashboard
  const stats = useMemo(() => {
    if (!statsData) {
      const totalBookings = filteredData.length
      const totalRevenue = filteredData.reduce((sum, item) => sum + Number.parseFloat(item.selling_price || "0"), 0)
      const totalPurchase = filteredData.reduce((sum, item) => sum + Number.parseFloat(item.purchase_price || "0"), 0)
      const profit = totalRevenue - totalPurchase
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
      const uniquePassengers = new Set(filteredData.map((item) => `${item.first_name} ${item.last_name}`)).size
      const pendingBookings = filteredData.filter((item) => item.status === "Pending").length
      const generatedBookings = filteredData.filter((item) => item.status === "Generated").length
      const rejectedBookings = filteredData.filter((item) => item.status === "Rejected").length

      return {
        totalBookings,
        totalRevenue,
        profit,
        averageBookingValue,
        uniquePassengers,
        pendingBookings,
        generatedBookings,
        rejectedBookings,
      }
    }

    return {
      totalBookings: statsData.totalBookings,
      totalRevenue: Number(statsData.totalRevenue),
      profit: Number(statsData.profit),
      averageBookingValue: statsData.totalBookings > 0 ? Number(statsData.totalRevenue) / statsData.totalBookings : 0,
      uniquePassengers: statsData.uniquePassengers,
      pendingBookings: statsData.pendingBookings,
      generatedBookings: statsData.generatedBookings,
      rejectedBookings: statsData.rejectedBookings,
    }
  }, [filteredData, statsData])

  // Monthly data for charts
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Generate sample data if no real data is available
    return months.map((month, index) => {
      // Find bookings for this month
      const monthBookings = voucherData.filter((booking) => {
        if (!booking.date_booked_request) return false
        const bookingDate = new Date(booking.date_booked_request)
        return bookingDate.getMonth() === index
      })

      const revenue = monthBookings.reduce((sum, booking) => sum + Number.parseFloat(booking.selling_price || "0"), 0)

      return {
        name: month,
        bookings: monthBookings.length,
        revenue: revenue,
      }
    })
  }, [voucherData])

  // Define table columns
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "reference_no",
        header: "Reference No.",
        cell: ({ row }) => <div className="font-medium">{row.getValue("reference_no") || "N/A"}</div>,
      },
      {
        accessorKey: "name",
        header: "Passenger Name",
        cell: ({ row }) => (
          <div className="font-medium">
            {`${row.original.title || ""} ${row.original.first_name || ""} ${row.original.middle_name || ""} ${row.original.last_name || ""}`.trim() ||
              "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "pnr",
        header: "PNR",
        cell: ({ row }) => <div>{row.getValue("pnr") || "N/A"}</div>,
      },
      {
        accessorKey: "type_of_travel",
        header: "Travel Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.getValue("type_of_travel") || "N/A"}
          </Badge>
        ),
      },
      {
        accessorKey: "email_client",
        header: "Client Email",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.getValue("email_client")}>
            {row.getValue("email_client") || "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "merchant_name",
        header: "Merchant",
        cell: ({ row }) => <div>{row.getValue("merchant_name") || "N/A"}</div>,
      },
      {
        accessorKey: "selling_price",
        header: "Price",
        cell: ({ row }) => (
          <div className="font-medium">₱ {formatNumber(Number.parseFloat(row.getValue("selling_price") || "0"))}</div>
        ),
      },
      {
        accessorKey: "date_booked_request",
        header: "Booking Date",
        cell: ({ row }) => {
          const date = row.getValue("date_booked_request") ? new Date(row.getValue("date_booked_request")) : null
          return <div>{date ? format(date, "MMM d, yyyy") : "N/A"}</div>
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge variant={status === "Generated" ? "default" : status === "Rejected" ? "destructive" : "secondary"}>
              {status || "Pending"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      const rowIndex = filteredData.findIndex((item) => item.id === row.original.id)
                      setCurrentVoucherId(rowIndex)
                      handleRowClick(row.original, rowIndex)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {row.original.status === "Generated" && row.original.pdf_url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(row.original.pdf_url, "_blank")
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Itinerary</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickView(row.original)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Quick View
                </DropdownMenuItem>
                {row.original.status !== "Generated" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      const rowIndex = filteredData.findIndex((item) => item.id === row.original.id)
                      setCurrentVoucherId(rowIndex)
                      setIsConfirmDialogOpen(true)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Generate Itinerary
                  </DropdownMenuItem>
                )}
                {row.original.status === "Pending" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      const rowIndex = filteredData.findIndex((item) => item.id === row.original.id)
                      setCurrentVoucherId(rowIndex)
                      setIsRejectDialogOpen(true)
                    }}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reject Booking
                  </DropdownMenuItem>
                )}
                {row.original.status === "Generated" && row.original.pdf_url && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      const rowIndex = filteredData.findIndex((item) => item.id === row.original.id)
                      setCurrentVoucherId(rowIndex)
                      setPdfUrl(row.original.pdf_url)
                      setIsPreviewDialogOpen(true)
                    }}
                  >
                    <IconSend className="mr-2 h-4 w-4" />
                    Send to Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    // Implement print functionality
                    toast({
                      title: "Print",
                      description: "Printing functionality will be implemented soon.",
                    })
                  }}
                >
                  <IconPrinter className="mr-2 h-4 w-4" />
                  Print Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [filteredData, handleRowClick, handleQuickView, toast],
  )

  // Initialize react-table
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-500 mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  // Preview dialog component
  const PreviewDialog = ({
    pdfUrl,
    onSend,
    onClose,
    isSending,
    booking,
  }: {
    pdfUrl: string;
    onSend: () => void;
    onClose: () => void;
    isSending: boolean;
    booking?: any; // Add booking parameter
  }) => (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview Itinerary</DialogTitle>
          <DialogDescription>Review the generated itinerary before sending</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded border h-[500px]">
          <iframe src={pdfUrl} width="100%" height="100%" title="Itinerary Preview" className="border" />
        </div>
        <DialogFooter className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onSend} disabled={isSending} className="flex items-center">
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <IconSend className="mr-2 h-4 w-4" />
                Send to Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Quick View component
  const QuickView = ({ booking, onClose }: { booking: any; onClose: () => void }) => {
    if (!booking) return null

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Booking Quick View</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {`${booking.title || ""} ${booking.first_name || ""} ${booking.last_name || ""}`.trim()}
                  </h3>
                  <p className="text-sm text-muted-foreground">{booking.email_client}</p>
                </div>
                <Badge
                  variant={
                    booking.status === "Generated"
                      ? "default"
                      : booking.status === "Rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {booking.status || "Pending"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Reference No.</p>
                  <p className="font-medium">{booking.reference_no || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">PNR</p>
                  <p className="font-medium">{booking.pnr || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Travel Type</p>
                  <Badge variant="outline" className="capitalize">
                    {booking.type_of_travel || "N/A"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Booking Date</p>
                  <p className="font-medium">
                    {booking.date_booked_request ? format(new Date(booking.date_booked_request), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Selling Price</p>
                  <p className="font-medium">₱ {formatNumber(Number.parseFloat(booking.selling_price || "0"))}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                  <p className="font-medium">₱ {formatNumber(Number.parseFloat(booking.purchase_price || "0"))}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose()
                      const rowIndex = filteredData.findIndex((item) => item.id === booking.id)
                      setCurrentVoucherId(rowIndex)
                      handleRowClick(booking, rowIndex)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Details
                  </Button>
                  {booking.status !== "Generated" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        onClose()
                        const rowIndex = filteredData.findIndex((item) => item.id === booking.id)
                        setCurrentVoucherId(rowIndex)
                        setIsConfirmDialogOpen(true)
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Generate Itinerary
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  // Booking details component
  const BookingDetails = ({ booking }: { booking: any }) => {
    const [airports, setAirports] = useState<any>(null)
    const [airportsLoading, setAirportsLoading] = useState<boolean>(true)

    useEffect(() => {
      async function fetchAirports() {
        const airportRequests: { key: string; id: any }[] = []

        if (booking.departure_airport_id) {
          airportRequests.push({ key: "departure", id: booking.departure_airport_id })
        }
        if (booking.destination_airport_id) {
          airportRequests.push({ key: "destination", id: booking.destination_airport_id })
        }
        if (booking.return_departure_airport_id) {
          airportRequests.push({ key: "returnDeparture", id: booking.return_departure_airport_id })
        }
        if (booking.return_destination_airport_id) {
          airportRequests.push({ key: "returnDestination", id: booking.return_destination_airport_id })
        }

        try {
          const promises = airportRequests.map((req) => getAirportById(req.id))
          const results = await Promise.all(promises)

          const fetchedAirports: any = {}
          results.forEach((result, index) => {
            const key = airportRequests[index].key
            if (result.success) {
              fetchedAirports[key] = result.data
            }
          })
          setAirports(fetchedAirports)
        } catch (error) {
          console.error("Error fetching airports:", error)
        }
        setAirportsLoading(false)
      }

      fetchAirports()
    }, [booking])

    if (!booking) return null

    // Format flight class
    function formatFlightClass(flightClass: string): string {
      if (!flightClass) return "N/A"
      return flightClass
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    return (
      <motion.div
        className="w-full max-h-[calc(100vh-10rem)] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Booking Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[calc(100vh-20rem)] mt-4">
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Passenger Details */}
                  <h3 className="text-lg font-semibold border-b pb-2">Passenger Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Detail title="Reference No" value={booking.reference_no} />
                    <Detail
                      title="Name"
                      value={
                        `${booking.title || ""} ${booking.first_name || ""}${booking.middle_name ? ` ${booking.middle_name}` : ""} ${booking.last_name || ""}`.trim() ||
                        "N/A"
                      }
                    />
                    <Detail title="Client Email" value={booking.email_client} />
                    <Detail title="Status" value={booking.status} isBadge />
                  </div>

                  {/* Flight Details */}
                  <h3 className="text-lg font-semibold border-b pb-2 mt-6">Flight Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Detail title="Airline" value={booking.airbus_details_depart || "N/A"} />
                    <Detail title="PNR" value={booking.pnr || "N/A"} />
                    <Detail title="Type of Travel" value={booking.type_of_travel || "N/A"} />
                    <Detail title="Flight Class" value={formatFlightClass(booking.flight_class_depart)} />
                    <Detail title="Baggage" value={`${booking.baggage_kilogram || 0} kg`} />
                  </div>

                  {/* Airport Details */}
                  {!airportsLoading && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold border-b pb-2">Route Information</h3>
                      <div className="mt-4 space-y-6">
                        {airports.departure && (
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-medium text-primary mb-2">Departure</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Detail
                                title="Airport"
                                value={`${airports.departure.name} (${airports.departure.code})`}
                              />
                              <Detail title="Location" value={airports.departure.location} />
                              <Detail
                                title="Date and Time"
                                value={
                                  booking.departure_date
                                    ? format(new Date(booking.departure_date), "MMM d, yyyy h:mm a")
                                    : "N/A"
                                }
                              />
                            </div>
                          </div>
                        )}

                        {airports.destination && (
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-medium text-primary mb-2">Destination</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Detail
                                title="Airport"
                                value={`${airports.destination.name} (${airports.destination.code})`}
                              />
                              <Detail title="Location" value={airports.destination.location} />
                              <Detail
                                title="Date and Time"
                                value={
                                  booking.destination_date
                                    ? format(new Date(booking.destination_date), "MMM d, yyyy h:mm a")
                                    : "N/A"
                                }
                              />
                            </div>
                          </div>
                        )}

                        {booking.type_of_travel === "round-trip" && (
                          <>
                            {airports.returnDeparture && (
                              <div className="p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium text-primary mb-2">Return Departure</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Detail
                                    title="Airport"
                                    value={`${airports.returnDeparture.name} (${airports.returnDeparture.code})`}
                                  />
                                  <Detail title="Location" value={airports.returnDeparture.location} />
                                  <Detail
                                    title="Date and Time"
                                    value={
                                      booking.return_departure_date
                                        ? format(new Date(booking.return_departure_date), "MMM d, yyyy h:mm a")
                                        : "N/A"
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {airports.returnDestination && (
                              <div className="p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium text-primary mb-2">Return Destination</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Detail
                                    title="Airport"
                                    value={`${airports.returnDestination.name} (${airports.returnDestination.code})`}
                                  />
                                  <Detail title="Location" value={airports.returnDestination.location} />
                                  <Detail
                                    title="Date and Time"
                                    value={
                                      booking.return_destination_date
                                        ? format(new Date(booking.return_destination_date), "MMM d, yyyy h:mm a")
                                        : "N/A"
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Merchant Details */}
                  <h3 className="text-lg font-semibold border-b pb-2 mt-6">Merchant Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Detail title="Merchant Name" value={booking.merchant_name || "N/A"} />
                    <Detail title="Travel Agency" value={booking.travel_agency_name || "N/A"} />
                    <Detail title="Agency Address" value={booking.travel_agency_address || "N/A"} />
                    <Detail title="Contact Number" value={booking.contact_number_merchant || "N/A"} />
                    <Detail title="Email" value={booking.email_merchant || "N/A"} />
                    <Detail title="Social Media" value={booking.social_media_page || "N/A"} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-medium text-primary mb-4">Price Breakdown</h3>
                      <div className="space-y-4">
                        <Detail title="Purchase Price" value={booking.purchase_price || 0} isCurrency />
                        <Detail title="Selling Price" value={booking.selling_price || 0} isCurrency />
                        <Detail title="Amount Paid" value={booking.amount_paid || 0} isCurrency />
                        <div className="pt-4 border-t">
                          <Detail
                            title="Profit"
                            value={(
                              Number.parseFloat(booking.selling_price || 0) -
                              Number.parseFloat(booking.purchase_price || 0)
                            ).toFixed(2)}
                            isCurrency
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-medium text-primary mb-4">Payment Details</h3>
                      <div className="space-y-4">
                        <Detail title="Payment Method" value={booking.payment_method || "N/A"} />
                        <Detail
                          title="Date Booked"
                          value={
                            booking.date_booked_request
                              ? format(new Date(booking.date_booked_request), "MMM d, yyyy h:mm a")
                              : "N/A"
                          }
                        />
                        {booking.status === "Generated" && booking.date_generated_rejected && (
                          <Detail
                            title="Date Generated"
                            value={format(new Date(booking.date_generated_rejected), "MMM d, yyyy h:mm a")}
                          />
                        )}
                        {booking.status === "Rejected" && booking.date_generated_rejected && (
                          <Detail
                            title="Date Rejected"
                            value={format(new Date(booking.date_generated_rejected), "MMM d, yyyy h:mm a")}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.payment_method !== "credits" && (
                    <div className="mb-8">
                      <h3 className="font-medium text-primary mb-4">Proof of Payment</h3>
                      {booking.proof_of_payment_url ? (
                        <div className="border rounded-lg overflow-hidden p-2 bg-muted/30">
                          <Image
                            src={booking.proof_of_payment_url || "/placeholder.svg"}
                            alt="Proof of Payment"
                            width={600}
                            height={400}
                            className="w-full max-w-2xl h-auto object-cover rounded mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="p-8 border rounded-lg text-center text-muted-foreground">
                          No proof of payment uploaded
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status === "Generated" && booking.pdf_url && (
                    <div>
                      <h3 className="font-medium text-primary mb-4">Generated Itinerary</h3>
                      <div className="flex flex-col items-center gap-4">
                        <div className="border rounded-lg overflow-hidden w-full h-[400px] bg-white">
                          <iframe
                            src={booking.pdf_url}
                            width="100%"
                            height="100%"
                            title="Itinerary PDF"
                            className="border-0"
                            sandbox="allow-same-origin allow-scripts allow-popups"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => window.open(booking.pdf_url, "_blank")}>
                            <FileText className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => {
                              setPdfUrl(booking.pdf_url)
                              setIsPreviewDialogOpen(true)
                              const rowIndex = filteredData.findIndex((item) => item.id === booking.id);
                              if (rowIndex !== -1) {
                                setCurrentVoucherId(rowIndex);
                              }
                            }}
                          >
                            <IconSend className="mr-2 h-4 w-4" />
                            Send to Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.status === "Rejected" && booking.reason_of_rejected && (
                    <div className="mt-4">
                      <h3 className="font-medium text-destructive mb-4">Rejection Reason</h3>
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive-foreground">{booking.reason_of_rejected}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </motion.div>
    )
  }

  // Detail component for booking details
  const Detail = ({
    title,
    value,
    isCurrency = false,
    isBadge = false,
  }: {
    title: string
    value: string | number | React.ReactNode
    isCurrency?: boolean
    isBadge?: boolean
  }) => (
    <div className="space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      {isBadge ? (
        <Badge variant={value === "Generated" ? "default" : value === "Rejected" ? "destructive" : "secondary"}>
          {value}
        </Badge>
      ) : (
        <div className="font-medium">
          {isCurrency ? `₱ ${formatNumber(Number.parseFloat((value as string) || "0"))}` : value || "N/A"}
        </div>
      )}
    </div>
  )

  // Date picker component
  const DatePickerWithRange = ({
    className,
    date,
    onDateChange,
  }: React.HTMLAttributes<HTMLDivElement> & {
    date: DateRange | undefined
    onDateChange: (range: DateRange | undefined) => void
  }) => (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )

  // Grid view component
  const GridView = ({ data }: { data: any[] }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((booking) => (
          <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {`${booking.first_name || ""} ${booking.last_name || ""}`.trim() || "N/A"}
                  </CardTitle>
                  <CardDescription className="truncate max-w-[200px]">{booking.email_client || "N/A"}</CardDescription>
                </div>
                <Badge
                  variant={
                    booking.status === "Generated"
                      ? "default"
                      : booking.status === "Rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {booking.status || "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-medium">{booking.reference_no || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PNR:</span>
                  <span className="font-medium">{booking.pnr || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travel Type:</span>
                  <span className="font-medium capitalize">{booking.type_of_travel || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">₱ {formatNumber(Number.parseFloat(booking.selling_price || "0"))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {booking.date_booked_request ? format(new Date(booking.date_booked_request), "MMM d, yyyy") : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => handleQuickView(booking)}>
                <Eye className="h-3.5 w-3.5 mr-1" />
                Quick View
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const rowIndex = filteredData.findIndex((item) => item.id === booking.id)
                  setCurrentVoucherId(rowIndex)
                  handleRowClick(booking, rowIndex)
                }}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Dashboard Overview */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Travel Bookings Dashboard</h2>
            <p className="text-muted-foreground">Manage and track all your travel bookings in one place.</p>
          </div>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <Button variant="outline" onClick={fetchData} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isClient && (
                  <CSVLink data={filteredData} filename="travel_bookings.csv">
                    <DropdownMenuItem>
                      <IconFileTypeCsv className="mr-2 h-4 w-4" />
                      <span>Export as CSV</span>
                    </DropdownMenuItem>
                  </CSVLink>
                )}
                <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                  <IconPrinter className="mr-2 h-4 w-4" />
                  <span>Print Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <IconCalendarStats className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{stats.uniquePassengers} unique passengers</p>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground cursor-help">
                      <span>Details</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Booking Status Breakdown</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                            <span className="text-xs">Pending</span>
                          </div>
                          <p className="text-sm font-medium">{stats.pendingBookings}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                            <span className="text-xs">Generated</span>
                          </div>
                          <p className="text-sm font-medium">{stats.generatedBookings}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                            <span className="text-xs">Rejected</span>
                          </div>
                          <p className="text-sm font-medium">{stats.rejectedBookings}</p>
                        </div>
                      </div>
                      <Progress value={(stats.generatedBookings / stats.totalBookings) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {((stats.generatedBookings / stats.totalBookings) * 100).toFixed(1)}% of bookings have been
                        generated
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱ {formatNumber(stats.totalRevenue)}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  ₱ {formatNumber(stats.averageBookingValue)} avg. per booking
                </p>
                <Badge variant="outline" className="text-xs">
                  {stats.totalBookings > 0 ? `${stats.totalBookings} bookings` : "No bookings"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit</CardTitle>
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱ {formatNumber(stats.profit)}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {((stats.profit / stats.totalRevenue) * 100 || 0).toFixed(1)}% margin
                </p>
                <div className="flex items-center">
                  {stats.profit > 0 ? (
                    <Badge variant="default" className="text-xs">
                      Profitable
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Loss
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Pending</div>
                  <div className="font-bold">{stats.pendingBookings}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Generated</div>
                  <div className="font-bold">{stats.generatedBookings}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Rejected</div>
                  <div className="font-bold">{stats.rejectedBookings}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Completion Rate</span>
                  <span className="text-xs font-medium">
                    {((stats.generatedBookings / (stats.totalBookings || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(stats.generatedBookings / (stats.totalBookings || 1)) * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Bookings</CardTitle>
              <CardDescription>Number of bookings per month</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value} bookings`, "Bookings"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue generated per month</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => [`₱ ${formatNumber(value)}`, "Revenue"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, name, PNR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFilterPreset === "all" ? (
                    "All Time"
                  ) : dateFilterPreset === "custom" && dateRange ? (
                    <>
                      {dateRange.from ? format(dateRange.from, "MMM d") : "N/A"}
                      {dateRange.to && ` - ${format(dateRange.to, "MMM d")}`}
                    </>
                  ) : (
                    dateFilterPresets.find((p) => p.value === dateFilterPreset)?.label
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b">
                  <div className="space-y-1">
                    {dateFilterPresets.map((preset) => (
                      <Button
                        key={preset.value}
                        variant={dateFilterPreset === preset.value ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => applyDateFilterPreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {dateFilterPreset === "custom" && (
                  <div className="p-2 pt-0">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateChange}
                      numberOfMonths={2}
                      className="border-t pt-2 mt-2"
                    />
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Advanced Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Date Field</h4>
                    <Select value={selectedDateField} onValueChange={handleDateFieldChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date_booked_request">Booking Date</SelectItem>
                        <SelectItem value="departure_date">Departure Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Date Range</h4>
                    <DatePickerWithRange date={dateRange} onDateChange={handleDateChange} />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Travel Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {["one-way", "round-trip", "domestic", "international"].map((type) => (
                        <Button
                          key={type}
                          variant={travelTypes.includes(type) ? "default" : "outline"}
                          onClick={() => handleTravelTypeChange(type)}
                          className="capitalize"
                          size="sm"
                        >
                          {type.replace("-", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Price Range</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <Input
                          type="number"
                          value={amountRange[0]}
                          onChange={(e) => setAmountRange([Number(e.target.value), amountRange[1]])}
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground mt-1">Min</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">to</span>
                      <div className="flex flex-col">
                        <Input
                          type="number"
                          value={amountRange[1]}
                          onChange={(e) => setAmountRange([amountRange[0], Number(e.target.value)])}
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground mt-1">Max</span>
                      </div>
                    </div>

                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-6"
                      value={amountRange}
                      onValueChange={handleAmountRangeChange}
                      min={0}
                      max={100000}
                      step={1000}
                    >
                      <Slider.Track className="bg-slate-200 relative flex-1 rounded-full h-2">
                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb
                        className="block w-5 h-5 bg-primary shadow-md rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label="Min amount"
                      />
                      <Slider.Thumb
                        className="block w-5 h-5 bg-primary shadow-md rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label="Max amount"
                      />
                    </Slider.Root>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>₱{amountRange[0].toLocaleString()}</span>
                      <span>₱{amountRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button onClick={applyAdvancedFilters}>Apply Filters</Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center space-x-2 border rounded-md px-2">
              <Button
                variant={viewMode === "table" ? "ghost" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-muted" : ""}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </svg>
              </Button>
              <Button
                variant={viewMode === "grid" ? "ghost" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-muted" : ""}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <IconColumns className="mr-2 h-4 w-4" />
                  Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className="bg-muted/50 p-2 rounded-md flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedRows.length === filteredData.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedRows(filteredData.map((item) => item.id.toString()))
                  } else {
                    setSelectedRows([])
                  }
                }}
                aria-label="Select all"
                className="translate-y-[2px]"
              />
              <span className="text-sm font-medium">
                {selectedRows.length} {selectedRows.length === 1 ? "booking" : "bookings"} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("generate")}
                disabled={selectedRows.length === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Generate Itineraries
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("reject")}
                disabled={selectedRows.length === 0}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Reject Bookings
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRows([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all" className="flex items-center justify-center">
              <span className="mr-2">All</span>
              <Badge variant="outline" className="ml-auto">
                {voucherData.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="Pending" className="flex items-center justify-center">
              <span className="mr-2">Pending</span>
              <Badge variant="outline" className="ml-auto">
                {voucherData.filter((item) => item.status === "Pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="Generated" className="flex items-center justify-center">
              <span className="mr-2">Generated</span>
              <Badge variant="outline" className="ml-auto">
                {voucherData.filter((item) => item.status === "Generated").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="Rejected" className="flex items-center justify-center">
              <span className="mr-2">Rejected</span>
              <Badge variant="outline" className="ml-auto">
                {voucherData.filter((item) => item.status === "Rejected").length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table or Grid View */}
      {viewMode === "table" ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-center">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [...Array(5)].map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      onClick={() => {
                        const rowIndex = filteredData.findIndex((item) => item.id === row.original.id)
                        handleRowClick(row.original, rowIndex)
                      }}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-center">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-12 w-12 text-muted-foreground mb-2"
                        >
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                        <Button variant="outline" onClick={resetFilters} className="mt-4">
                          Reset Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      ) : (
        <GridView data={filteredData} />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {voucherData.length} bookings
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-full max-w-4xl p-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>Booking Details</DialogTitle>
                  <DialogDescription>View and manage booking information</DialogDescription>
                </DialogHeader>
                <div className="px-6 py-4">
                  {filteredData[currentVoucherId] && <BookingDetails booking={filteredData[currentVoucherId]} />}
                </div>
                <DialogFooter className="px-6 pb-6">
                  {/* Action buttons based on booking status */}
                  {filteredData[currentVoucherId]?.status === "Pending" && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => setIsConfirmDialogOpen(true)}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Generate Itinerary
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setIsRejectDialogOpen(true)}
                        className="gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Reject Booking
                      </Button>
                    </>
                  )}

                  {filteredData[currentVoucherId]?.status !== "Generated" &&
                    filteredData[currentVoucherId]?.status !== "Pending" && (
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => setIsConfirmDialogOpen(true)}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Generate Itinerary
                      </Button>
                    )}

                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Quick View Dialog */}
      {isQuickViewOpen && quickViewBooking && (
        <QuickView booking={quickViewBooking} onClose={() => setIsQuickViewOpen(false)} />
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking. This information will be visible to the merchant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <textarea
              className="w-full p-3 border rounded-md min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter reason for rejection"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={handleReject} disabled={!remarks.trim()}>
              Reject
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reject Dialog */}
      <Dialog open={isConfirmRejectDialogOpen} onOpenChange={setIsConfirmRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rejection</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="font-medium mb-2">Reason for rejection:</p>
              <p className="text-sm">{remarks}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="destructive" onClick={confirmReject}>
              Confirm Reject
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsConfirmRejectDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Itinerary Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Itinerary</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate an itinerary for this booking? Once generated, the booking status will
              be updated and the client will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmGenerateItinerary} disabled={isGeneratingItinerary} className="gap-2">
              {isGeneratingItinerary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Itinerary
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      {isPreviewDialogOpen && pdfUrl && (
        <PreviewDialog
          pdfUrl={pdfUrl}
          onSend={handleSendEmail}
          onClose={handleClosePreview}
          isSending={isSendingEmail}
          booking={filteredData[currentVoucherId]} // Pass the current booking object
        />
      )}

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>Choose how you want to export your booking data</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data to Include</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="export-all" defaultChecked />
                  <Label htmlFor="export-all">All Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="export-filtered" />
                  <Label htmlFor="export-filtered">Filtered Data Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="export-selected" />
                  <Label htmlFor="export-selected">Selected Rows Only</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button>
              <IconDownload className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
