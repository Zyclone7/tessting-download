"use client"

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
    IconBed,
    IconMapPin,
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
import { format, isWithinInterval, startOfDay, endOfDay, subDays, differenceInDays } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Loader2, Eye, FileText, AlertTriangle, CheckCircle, Calendar, User, Clock } from "lucide-react"
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
import { getAllHotels, updateHotelStatus, getHotelStats } from "@/actions/hotel-booking"
import { getUserByUuid } from "@/actions/user"
import Image from "next/image"
import { pdf } from "@react-pdf/renderer"
import HoteItirenaryDocument from "@/components/hotel-iterinary-documents"
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

export default function HotelTable({ setViewVoucher, onRefresh }: Props) {
    // State management
    const [voucherData, setVoucherData] = useState<any[]>([])
    const [currentVoucherId, setCurrentVoucherId] = useState<number>(0)
    const [ifEditing, setIfEditing] = useState<boolean>(false)
    const [globalFilter, setGlobalFilter] = useState("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
    const [selectedDateField, setSelectedDateField] = useState<"date_booked_request" | "check_in_date">("date_booked_request")
    const [priceRangeValues, setPriceRangeValues] = useState<[number, number]>([0, 100000]) // Renamed to avoid conflict
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
    const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false)
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
    const [hotelFilters, setHotelFilters] = useState<string[]>([])
    const [guestsRange, setGuestsRange] = useState<[number, number]>([1, 10])

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
            { value: "tomorrow", label: "Tomorrow" },
            { value: "thisWeek", label: "This Week" },
            { value: "nextWeek", label: "Next Week" },
            { value: "thisMonth", label: "This Month" },
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
            case "tomorrow":
                from = new Date(today)
                from.setDate(today.getDate() + 1)
                to = from
                break
            case "thisWeek":
                from = startOfDay(today)
                to = new Date(today)
                to.setDate(today.getDate() + (6 - today.getDay()))
                break
            case "nextWeek":
                from = new Date(today)
                from.setDate(today.getDate() + (7 - today.getDay() + 1))
                to = new Date(from)
                to.setDate(from.getDate() + 6)
                break
            case "thisMonth":
                from = new Date(today.getFullYear(), today.getMonth(), 1)
                to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
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
            // Make a single API call to get all hotel data
            const result = await getAllHotels();

            if (result.success) {
                const hotelData = result.data;

                if (hotelData && hotelData.length > 0) {
                    // Enhance each booking with merchant info and payment defaults if needed
                    const enhancedData = await Promise.all(
                        hotelData.map(async (booking) => {
                            const enhancedBooking = await enhanceBookingWithMerchantInfo(booking);

                            // Set default payment method if not present
                            if (!enhancedBooking.payment_method) {
                                enhancedBooking.payment_method = "Maya";
                            }

                            // Set default amount_paid if not present
                            if (!enhancedBooking.amount_paid && enhancedBooking.payment_method === "Credits") {
                                enhancedBooking.amount_paid = enhancedBooking.selling_price;
                            }

                            return enhancedBooking;
                        })
                    );

                    setVoucherData(enhancedData);
                    setFilteredData(enhancedData);
                } else {
                    setVoucherData([]);
                    setFilteredData([]);
                }

                // Fetch stats in parallel
                const statsResult = await getHotelStats();
                if (statsResult.success) {
                    setStatsData(statsResult.data);
                }
            } else {
                setError(result.error || "An error occurred while fetching data");
                toast({
                    title: "Error",
                    description: result.error || "Failed to load hotel booking data",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("Error fetching hotel data:", err);
            setError("An error occurred while fetching data");
            toast({
                title: "Error",
                description: "Failed to load hotel booking data. Please try again.",
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
                    (item.booking_id && item.booking_id.toLowerCase().includes(query)) ||
                    (item.hotel_name && item.hotel_name.toLowerCase().includes(query)) ||
                    (item.first_name && item.first_name.toLowerCase().includes(query)) ||
                    (item.last_name && item.last_name.toLowerCase().includes(query)) ||
                    (item.email_client && item.email_client.toLowerCase().includes(query)) ||
                    (item.email_merchant && item.email_merchant.toLowerCase().includes(query)) ||
                    (item.merchant_name && item.merchant_name.toLowerCase().includes(query)) ||
                    (item.hotel_address && item.hotel_address.toLowerCase().includes(query))
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

            // Hotel filter
            const matchesHotel = hotelFilters.length === 0 ||
                (item.hotel_name && hotelFilters.includes(item.hotel_name))

            // Price range filtering
            const itemPrice = Number.parseFloat(item.selling_price || "0")
            const isInPriceRange = itemPrice >= priceRange[0] && itemPrice <= priceRange[1]

            // Guest range filtering
            const guestCount = Number(item.number_of_guests || 1)
            const isInGuestRange = guestCount >= guestsRange[0] && guestCount <= guestsRange[1]

            return isInDateRange && matchesHotel && isInPriceRange && isInGuestRange
        })

        setFilteredData(filtered)
        setIsFilterPopoverOpen(false)

        toast({
            title: "Filters Applied",
            description: `Showing ${filtered.length} of ${voucherData.length} bookings`,
        })
    }, [voucherData, dateRange, selectedDateField, hotelFilters, priceRangeValues, guestsRange, toast])

    // Reset all filters
    const resetFilters = useCallback(() => {
        setGlobalFilter("")
        setDateRange(undefined)
        setSelectedDateField("date_booked_request")
        setHotelFilters([])
        setPriceRangeValues([0, 100000])
        setGuestsRange([1, 10])
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
            // Make sure we have a valid index
            if (rowIndex === -1 || !filteredData[rowIndex]) {
                rowIndex = filteredData.findIndex(item => item.id === voucher.id);
            }

            setViewVoucher(voucher);
            setCurrentVoucherId(rowIndex);
            setIfEditing(false);
            setIsDialogOpen(true); // Make sure this actually opens the dialog
        },
        [setViewVoucher, filteredData]
    );

    // Handle quick view
    const handleQuickView = useCallback((booking: any) => {
        setQuickViewBooking(booking)
        setIsQuickViewOpen(true)
    }, [])

    // Handle hotel filter changes
    const handleHotelChange = useCallback((hotel: string) => {
        setHotelFilters((prev) =>
            prev.includes(hotel) ? prev.filter((h) => h !== hotel) : [...prev, hotel]
        )
    }, [])

    // Handle price range changes
    const handlePriceRangeChange = useCallback((value: number[]) => {
        setPriceRangeValues([value[0], value[1]])
    }, [])

    // Handle guests range changes
    const handleGuestsRangeChange = useCallback((value: number[]) => {
        setGuestsRange([value[0], value[1]])
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
        if (value === "date_booked_request" || value === "check_in_date") {
            setSelectedDateField(value as "date_booked_request" | "check_in_date")
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
                    description: `Generating vouchers for ${selectedRows.length} bookings...`,
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

    // Generate PDF for hotel itenerary
    const generateHotelVoucherPDF = useCallback(async (booking: any): Promise<{ success: boolean; url?: string }> => {
        try {
            // Get additional data needed for the voucher
            const bookingDates = {
                checkIn: booking.check_in_date ? new Date(booking.check_in_date) : null,
                checkOut: booking.check_out_date ? new Date(booking.check_out_date) : null,
                nights: booking.check_in_date && booking.check_out_date
                    ? differenceInDays(new Date(booking.check_out_date), new Date(booking.check_in_date))
                    : 0
            }

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

            // Parse additional guests
            let additionalGuests = []
            if (booking.additional_guests) {
                try {
                    if (typeof booking.additional_guests === 'string') {
                        additionalGuests = JSON.parse(booking.additional_guests)
                    } else {
                        additionalGuests = booking.additional_guests
                    }
                } catch (e) {
                    console.error("Error parsing additional guests:", e)
                }
            }

            // Generate PDF with all relevant data
            const blob = await pdf(
                <HoteItirenaryDocument
                    booking={booking}
                    bookingDates={bookingDates}
                    additionalGuests={additionalGuests}
                    travelLogoUrl={travelLogoUrl} // Add this line

                />
            ).toBlob()

            const pdfUrl = URL.createObjectURL(blob)
            return { success: true, url: pdfUrl }
        } catch (error) {
            console.error("Error generating PDF:", error)
            return { success: false }
        }
    }, [])

    // Send hotel itinerary email
    const sendHotelVoucherEmail = useCallback(
        async (clientEmail: string, pdfUrl: string): Promise<{ success: boolean }> => {
            try {
                const currentBooking = filteredData[currentVoucherId];

                // Add this block to get the latest travel logo URL
                let travelLogoUrl = null;
                if (currentBooking.uid) {
                    try {
                        const merchantResult = await getUserByUuid(currentBooking.uid.toString());
                        if (merchantResult.success && merchantResult.data) {
                            travelLogoUrl = merchantResult.data.travel_logo_url || null;
                        }
                    } catch (error) {
                        console.error("Error fetching merchant data for logo:", error);
                    }
                }

                // Update the API request to include the logo URL
                const response = await fetch("/api/send-hotel-itinerary", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        booking: currentBooking,
                        pdfUrl,
                        travelLogoUrl // Add this line
                    }),
                })
                const result = await response.json()
                return { success: result.success }
            } catch (error) {
                console.error("Error sending  email:", error)
                return { success: false }
            }
        },
        [filteredData, currentVoucherId],
    )

    // Handle confirm generate voucher
    const handleConfirmGenerateVoucher = useCallback(async () => {
        if (!filteredData[currentVoucherId]) {
            toast({
                title: "Error",
                description: "No booking selected.",
                variant: "destructive",
            })
            return
        }

        setIsGeneratingVoucher(true)

        try {
            // Generate the hotel PDF
            const pdfResult = await generateHotelVoucherPDF(filteredData[currentVoucherId])
            if (!pdfResult.success || !pdfResult.url) {
                toast({
                    title: "Error",
                    description: "Failed to generate hotel itinerary PDF. Please try again.",
                    variant: "destructive",
                })
                setIsGeneratingVoucher(false)
                return
            }

            // Update booking status with PDF URL
            const currentDate = new Date().toISOString()
            const result = await updateHotelStatus(
                filteredData[currentVoucherId].id,
                "Generated",
                currentDate,
                pdfResult.url,
            )

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Hotel Itinerary generated successfully.",
                })

                // Update local data
                const updatedData = voucherData.map((booking) =>
                    booking.id === filteredData[currentVoucherId].id
                        ? {
                            ...booking,
                            status: "Generated",
                            date_generated_rejected: currentDate,
                            pdf_url: pdfResult.url,
                        }
                        : booking,
                )

                setVoucherData(updatedData)
                applyFilters()

                setPdfUrl(pdfResult.url)
                setIsPreviewDialogOpen(true)
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update booking status.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error generating voucher:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsGeneratingVoucher(false)
        }
    }, [filteredData, currentVoucherId, generateHotelVoucherPDF, toast, voucherData, applyFilters])

    // Handle send email
    const handleSendEmail = useCallback(async () => {
        if (!filteredData[currentVoucherId] || !pdfUrl) return

        setIsSendingEmail(true)

        try {
            const emailResult = await sendHotelVoucherEmail(filteredData[currentVoucherId].email_client, pdfUrl)

            if (emailResult.success) {
                toast({
                    title: "Email Sent",
                    description: "Hotel Itinerary PDF has been sent to the client's email address.",
                })

                // Close dialogs and refresh data
                setIsPreviewDialogOpen(false)
                setIsConfirmDialogOpen(false)
                setIsDialogOpen(false)
                onRefresh()
            } else {
                toast({
                    title: "Error",
                    description: "Failed to send hotel Itinerary email. Please try again.",
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
    }, [filteredData, currentVoucherId, pdfUrl, sendHotelVoucherEmail, toast, onRefresh])

    // Handle close preview
    const handleClosePreview = useCallback(() => {
        setIsPreviewDialogOpen(false)
        URL.revokeObjectURL(pdfUrl || "") // Clean up the blob URL
        setPdfUrl(null)
    }, [pdfUrl])

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
            const result = await updateHotelStatus(filteredData[currentVoucherId].id, "Rejected", currentDate, remarks)

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
            const uniqueGuests = new Set(filteredData.map((item) => `${item.first_name} ${item.last_name}`)).size
            const pendingBookings = filteredData.filter((item) => item.status === "Pending").length
            const generatedBookings = filteredData.filter((item) => item.status === "Generated").length
            const rejectedBookings = filteredData.filter((item) => item.status === "Rejected").length
            const totalNights = filteredData.reduce((sum, item) => {
                if (item.check_in_date && item.check_out_date) {
                    const checkIn = new Date(item.check_in_date)
                    const checkOut = new Date(item.check_out_date)
                    return sum + differenceInDays(checkOut, checkIn)
                }
                return sum
            }, 0)

            return {
                totalBookings,
                totalRevenue,
                profit,
                averageBookingValue,
                uniqueGuests,
                pendingBookings,
                generatedBookings,
                rejectedBookings,
                totalNights,
            }
        }

        return {
            totalBookings: statsData.totalBookings,
            totalRevenue: Number(statsData.totalRevenue),
            profit: Number(statsData.profit),
            averageBookingValue: statsData.totalBookings > 0 ? Number(statsData.totalRevenue) / statsData.totalBookings : 0,
            uniqueGuests: statsData.uniqueCustomers,
            pendingBookings: statsData.pendingBookings,
            generatedBookings: statsData.generatedBookings,
            rejectedBookings: statsData.rejectedBookings,
            totalNights: 0, // Not provided in the stats data, would need to calculate
        }
    }, [filteredData, statsData])

    // Monthly data for charts
    const monthlyData = useMemo(() => {
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]

        // Generate data based on check-in dates
        return months.map((month, index) => {
            // Find bookings for this month
            const monthBookings = voucherData.filter(booking => {
                if (!booking.check_in_date) return false
                const bookingDate = new Date(booking.check_in_date)
                return bookingDate.getMonth() === index
            })

            const revenue = monthBookings.reduce(
                (sum, booking) => sum + Number.parseFloat(booking.selling_price || "0"),
                0
            )

            return {
                name: month,
                bookings: monthBookings.length,
                revenue: revenue,
                nights: monthBookings.reduce((sum, booking) => {
                    if (booking.check_in_date && booking.check_out_date) {
                        const checkIn = new Date(booking.check_in_date)
                        const checkOut = new Date(booking.check_out_date)
                        return sum + differenceInDays(checkOut, checkIn)
                    }
                    return sum
                }, 0)
            }

            return {
                name: month,
                bookings: monthBookings.length,
                revenue: revenue,
                nights: monthBookings.reduce((sum, booking) => {
                    if (booking.check_in_date && booking.check_out_date) {
                        const checkIn = new Date(booking.check_in_date)
                        const checkOut = new Date(booking.check_out_date)
                        return sum + differenceInDays(checkOut, checkIn)
                    }
                    return sum
                }, 0)
            }
        })
    }, [voucherData])

    // Table columns definition
    const columns: ColumnDef<any>[] = useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                        onCheckedChange={handleSelectAllRows}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={selectedRows.includes(row.original.id.toString())}
                        onCheckedChange={() => handleRowSelectionChange(row.original.id.toString())}
                        aria-label="Select row"
                        onClick={(e) => e.stopPropagation()}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "reference_no",
                header: "Reference",
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.getValue("reference_no") || "N/A"}
                    </span>
                ),
            },
            {
                accessorKey: "booking_id",
                header: "Booking ID",
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.getValue("booking_id") || "N/A"}
                    </span>
                ),
            },
            {
                accessorKey: "date_booked_request",
                header: "Date Booked",
                cell: ({ row }) => {
                    const date = row.getValue("date_booked_request")
                    return date ? format(new Date(date as string), "dd MMM yyyy") : "N/A"
                },
            },
            {
                accessorKey: "hotel_name",
                header: "Hotel",
                cell: ({ row }) => {
                    const hotelName = row.getValue("hotel_name") as string
                    const hotelAddress = row.original.hotel_address as string || "Unknown Address"

                    return (
                        <div className="flex flex-col space-y-1">
                            <span className="font-medium">{hotelName || "Unknown Hotel"}</span>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <IconMapPin size={12} className="mr-1" />
                                <span>{hotelAddress}</span>
                            </div>
                        </div>
                    )
                },
            },
            {
                accessorKey: "check_in_date",
                header: "Check-in",
                cell: ({ row }) => {
                    const date = row.getValue("check_in_date")
                    return date ? format(new Date(date as string), "dd MMM yyyy") : "N/A"
                },
            },
            {
                accessorKey: "check_out_date",
                header: "Check-out",
                cell: ({ row }) => {
                    const date = row.getValue("check_out_date")
                    return date ? format(new Date(date as string), "dd MMM yyyy") : "N/A"
                },
            },
            {
                accessorKey: "first_name",
                header: "Client Name",
                cell: ({ row }) => {
                    const firstName = row.getValue("first_name") as string
                    const lastName = row.original.last_name as string
                    return (
                        <span>
                            {firstName || ""} {lastName || ""}
                        </span>
                    )
                },
            },
            {
                accessorKey: "merchant_name",
                header: "Merchant",
                cell: ({ row }) => <span>{row.getValue("merchant_name") || "N/A"}</span>,
            },
            {
                accessorKey: "selling_price",
                header: "Price",
                cell: ({ row }) => {
                    const price = parseFloat(row.getValue("selling_price") || "0")
                    return (
                        <span className="font-medium">
                            {formatNumber(price)}
                        </span>
                    )
                },
            },
            {
                accessorKey: "payment_method",
                header: "Payment",
                cell: ({ row }) => {
                    const paymentMethod = row.getValue("payment_method") as string || "Maya";
                    const hasProofOfPayment = Boolean(row.original.proof_of_payment_url);

                    return (
                        <div className="flex flex-col">
                            <span className="font-medium">{paymentMethod}</span>
                            {hasProofOfPayment && (
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <span className="text-xs text-primary cursor-pointer underline">Receipt</span>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">Proof of Payment</h4>
                                            <div className="border rounded overflow-hidden">
                                                <Image
                                                    src={row.original.proof_of_payment_url}
                                                    alt="Payment Receipt"
                                                    width={300}
                                                    height={200}
                                                    className="w-full h-auto object-contain"
                                                />
                                            </div>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const status = row.getValue("status") as string
                    return (
                        <Badge
                            variant="outline"
                            className={cn(
                                "whitespace-nowrap",
                                status === "Pending" && "border-amber-500 text-amber-700 bg-amber-50",
                                status === "Generated" && "border-green-500 text-green-700 bg-green-50",
                                status === "Rejected" && "border-red-500 text-red-700 bg-red-50"
                            )}
                        >
                            {status === "Pending" && <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />}
                            {status === "Generated" && <CheckCircle className="mr-1 h-3 w-3 text-green-500" />}
                            {status === "Rejected" && <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />}
                            {status || "Unknown"}
                        </Badge>
                    )
                },
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const booking = row.original

                    return (
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleQuickView(booking)
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Quick View</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )
                },
            },
        ],
        [filteredData.length, handleQuickView, handleRowSelectionChange, handleSelectAllRows, selectedRows]
    );


    // Initialize the table
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
        },
    })

    // Get unique hotel names for filtering
    const uniqueHotels = useMemo(() => {
        const hotels = new Set<string>()
        voucherData.forEach((item) => {
            if (item.hotel_name) {
                hotels.add(item.hotel_name)
            }
        })
        return Array.from(hotels).sort()
    }, [voucherData])

    // Get min/max prices for range filter
    const priceRange = useMemo(() => {
        if (!voucherData.length) return [0, 10000]

        let min = Infinity
        let max = 0

        voucherData.forEach((item) => {
            const price = parseFloat(item.selling_price || "0")
            if (price < min) min = price
            if (price > max) max = price
        })

        return [Math.floor(min), Math.ceil(max)]
    }, [voucherData])

    // If loading is true, show a skeleton
    if (loading && !isRefreshing) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>

                <div className="rounded-md border">
                    <Skeleton className="h-10 w-full" />
                    {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    // Main component render
    return (
        <>
            <AnimatePresence>
                {isRefreshing && (
                    <motion.div
                        className="fixed top-4 right-4 z-50 p-4 bg-white rounded-xl shadow-lg flex items-center space-x-2"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                    >
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Refreshing data...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toaster />

            <div className="space-y-6">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <IconBed size={20} className="text-primary" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {stats.generatedBookings} Generated
                                </Badge>{" "}
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    {stats.pendingBookings} Pending
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">₱{formatNumber(stats.totalRevenue)}</div>
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <IconCurrencyDollar size={20} className="text-primary" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                <span className="text-green-600">
                                    ₱{formatNumber(stats.profit)} profit
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Average Booking</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">₱{formatNumber(stats.averageBookingValue)}</div>
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <IconChartBar size={20} className="text-primary" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                From {stats.totalBookings} bookings
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Guests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{stats.uniqueGuests}</div>
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <IconUsers size={20} className="text-primary" />
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                {stats.totalNights} total nights booked
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Booking Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Bookings</CardTitle>
                        <CardDescription>Booking trends over the past year</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip
                                        formatter={(value, name) => {
                                            if (name === "revenue") return [`₱${formatNumber(value as number)}`, "Revenue"]
                                            return [value, name === "bookings" ? "Bookings" : "Nights"]
                                        }}
                                    />
                                    <Bar dataKey="bookings" fill="#93c5fd" name="Bookings" />
                                    <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Filters and Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="Pending" className="relative">
                                    Pending
                                    {stats.pendingBookings > 0 && (
                                        <Badge variant="outline" className="ml-1 bg-amber-50 text-amber-700 border-amber-200">
                                            {stats.pendingBookings}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="Generated">Generated</TabsTrigger>
                                <TabsTrigger value="Rejected">Rejected</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="w-full md:w-auto flex gap-2">
                            <div className="relative flex-grow md:flex-grow-0">
                                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search bookings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-full md:w-[250px]"
                                />
                            </div>

                            <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-1">
                                        <IconFilter className="h-4 w-4" />
                                        <span className="hidden md:inline">Filter</span>
                                        {(dateRange || hotelFilters.length > 0) && (
                                            <Badge className="ml-1 bg-primary text-primary-foreground">
                                                {(dateRange ? 1 : 0) + (hotelFilters.length > 0 ? 1 : 0)}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Filter Bookings</h4>

                                        <div className="space-y-2">
                                            <Label>Date Filter</Label>
                                            <Select
                                                value={selectedDateField}
                                                onValueChange={handleDateFieldChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select date field" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="date_booked_request">Booking Date</SelectItem>
                                                    <SelectItem value="check_in_date">Check-in Date</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={dateFilterPreset}
                                                onValueChange={(value) => {
                                                    setDateFilterPreset(value)
                                                    applyDateFilterPreset(value)
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select date range" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dateFilterPresets.map((preset) => (
                                                        <SelectItem key={preset.value} value={preset.value}>
                                                            {preset.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {dateFilterPreset === "custom" && (
                                                <div className="flex flex-col space-y-2 pt-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "justify-start text-left font-normal",
                                                                    !dateRange && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {dateRange?.from ? (
                                                                    dateRange.to ? (
                                                                        <>
                                                                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                                                        </>
                                                                    ) : (
                                                                        format(dateRange.from, "LLL dd, y")
                                                                    )
                                                                ) : (
                                                                    <span>Pick a date range</span>
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <CalendarComponent
                                                                initialFocus
                                                                mode="range"
                                                                defaultMonth={dateRange?.from}
                                                                selected={dateRange}
                                                                onSelect={handleDateChange}
                                                                numberOfMonths={2}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Price Range </Label>
                                            <div className="pt-2">
                                                <Slider.Root
                                                    className="relative flex items-center select-none touch-none w-full h-5"
                                                    value={priceRange}
                                                    onValueChange={handlePriceRangeChange}
                                                    min={0}
                                                    max={100000}
                                                    step={100}
                                                >
                                                    <Slider.Track className="bg-slate-100 relative grow rounded-full h-[3px]">
                                                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                                    </Slider.Track>
                                                    <Slider.Thumb
                                                        className="block w-5 h-5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 focus:outline-none focus:shadow-md"
                                                        aria-label="Min price"
                                                    />
                                                    <Slider.Thumb
                                                        className="block w-5 h-5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 focus:outline-none focus:shadow-md"
                                                        aria-label="Max price"
                                                    />
                                                </Slider.Root>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>₱{formatNumber(priceRange[0])}</span>
                                                <span>₱{formatNumber(priceRange[1])}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Hotels</Label>
                                            <ScrollArea className="h-32 rounded-md border p-2">
                                                <div className="space-y-2">
                                                    {uniqueHotels.map((hotel) => (
                                                        <div key={hotel} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`hotel-${hotel}`}
                                                                checked={hotelFilters.includes(hotel)}
                                                                onCheckedChange={() => handleHotelChange(hotel)}
                                                            />
                                                            <Label htmlFor={`hotel-${hotel}`} className="text-sm cursor-pointer">
                                                                {hotel}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Number of Guests</Label>
                                            <div className="pt-2">
                                                <Slider.Root
                                                    className="relative flex items-center select-none touch-none w-full h-5"
                                                    value={guestsRange}
                                                    onValueChange={handleGuestsRangeChange}
                                                    min={1}
                                                    max={10}
                                                    step={1}
                                                >
                                                    <Slider.Track className="bg-slate-100 relative grow rounded-full h-[3px]">
                                                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                                    </Slider.Track>
                                                    <Slider.Thumb
                                                        className="block w-5 h-5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 focus:outline-none focus:shadow-md"
                                                        aria-label="Min guests"
                                                    />
                                                    <Slider.Thumb
                                                        className="block w-5 h-5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 focus:outline-none focus:shadow-md"
                                                        aria-label="Max guests"
                                                    />
                                                </Slider.Root>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>{guestsRange[0]} guest{guestsRange[0] !== 1 ? "s" : ""}</span>
                                                <span>{guestsRange[1]} guest{guestsRange[1] !== 1 ? "s" : ""}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-2">
                                            <Button variant="outline" size="sm" onClick={resetFilters}>
                                                Reset
                                            </Button>
                                            <Button size="sm" onClick={applyAdvancedFilters}>
                                                Apply Filters
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchData}
                            disabled={isRefreshing}
                            className="h-9 w-9"
                        >
                            <IconRefresh className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-9 px-3">
                                    <IconDotsVertical className="h-4 w-4" />
                                    <span className="ml-2 hidden md:inline">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}>
                                    <IconColumns className="mr-2 h-4 w-4" />
                                    <span>Toggle View</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleBulkAction("generate")} disabled={selectedRows.length === 0}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Generate Selected</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkAction("reject")} disabled={selectedRows.length === 0}>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    <span>Reject Selected</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                                    <IconFileTypeCsv className="mr-2 h-4 w-4" />
                                    <span>Export CSV</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-9">
                                    <IconColumns className="h-4 w-4 mr-2" />
                                    <span>Columns</span>
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
                                                {column.id.replace(/_/g, " ")}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {user?.role === "administrator" && (

                            <CSVLink
                                data={filteredData.map((item) => ({
                                    Reference: item.reference_no,
                                    "Booking ID": item.booking_id,
                                    Status: item.status,
                                    "Date Booked": item.date_booked_request,
                                    "Hotel Name": item.hotel_name,
                                    "Hotel Address": item.hotel_address,
                                    "Check In": item.check_in_date,
                                    "Check Out": item.check_out_date,
                                    "Number of Nights": item.check_in_date && item.check_out_date
                                        ? differenceInDays(new Date(item.check_out_date), new Date(item.check_in_date))
                                        : "N/A",
                                    "Client Name": `${item.first_name || ""} ${item.last_name || ""}`,
                                    "Client Email": item.email_client,
                                    "Number of Guests": item.number_of_guests,
                                    "Payment Method": item.payment_method || "Maya",
                                    "Amount Paid": item.payment_method === "Credits"
                                        ? item.amount_paid
                                        : item.selling_price,
                                    "Has Proof of Payment": item.proof_of_payment_url ? "Yes" : "No",
                                    "Merchant Name": item.merchant_name,
                                    "Selling Price": item.selling_price,
                                    "Purchase Price": item.purchase_price,
                                    "Profit": (parseFloat(item.selling_price || "0") - parseFloat(item.purchase_price || "0")).toFixed(2),
                                }))}
                                filename={`hotel_bookings_export_${format(new Date(), "yyyy-MM-dd")}.csv`}
                                onClick={() => setIsExportDialogOpen(false)}
                            >
                                <Button className="bg-primary hover:bg-primary/90">
                                    <IconFileTypeCsv className="mr-2 h-4 w-4" /> Export CSV
                                </Button>
                            </CSVLink>
                        )}
                    </div>
                </div>

                {/* Table or Grid View */}
                {viewMode === "table" ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            onClick={() => handleRowClick(row.original, parseInt(row.id))}
                                            className="cursor-pointer"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            {loading ? (
                                                <div className="flex justify-center items-center h-full">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                                                    <span>Loading bookings...</span>
                                                </div>
                                            ) : error ? (
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                                    <p className="text-red-500">{error}</p>
                                                    <Button variant="outline" size="sm" onClick={fetchData}>
                                                        <IconRefresh className="mr-2 h-4 w-4" />
                                                        Retry
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                    <p>No bookings found</p>
                                                    {searchQuery || statusFilter !== "all" || dateRange ? (
                                                        <Button variant="outline" size="sm" onClick={resetFilters}>
                                                            Clear Filters
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    // Grid view for hotel bookings
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredData.length > 0 ? (
                            filteredData.map((booking, index) => (
                                <Card
                                    key={booking.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => {
                                        const index = filteredData.findIndex(item => item.id === booking.id);
                                        handleRowClick(booking, index);
                                    }}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base">{booking.hotel_name || "Unknown Hotel"}</CardTitle>
                                                <CardDescription className="flex items-center">
                                                    <IconMapPin size={12} className="mr-1" />
                                                    {booking.hotel_address || "Unknown Address"}
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "whitespace-nowrap",
                                                    booking.status === "Pending" && "border-amber-500 text-amber-700 bg-amber-50",
                                                    booking.status === "Generated" && "border-green-500 text-green-700 bg-green-50",
                                                    booking.status === "Rejected" && "border-red-500 text-red-700 bg-red-50"
                                                )}
                                            >
                                                {booking.status === "Pending" && <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />}
                                                {booking.status === "Generated" && <CheckCircle className="mr-1 h-3 w-3 text-green-500" />}
                                                {booking.status === "Rejected" && <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />}
                                                {booking.status || "Unknown"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="flex items-center text-sm mb-2">
                                            <span className="text-muted-foreground mr-1">ID:</span>
                                            <span className="font-medium">{booking.booking_id || "N/A"}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm">
                                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>
                                                    {booking.first_name || ""} {booking.last_name || ""}
                                                </span>
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span>
                                                        {booking.check_in_date
                                                            ? format(new Date(booking.check_in_date), "MMM dd, yyyy")
                                                            : "N/A"} - {" "}
                                                        {booking.check_out_date
                                                            ? format(new Date(booking.check_out_date), "MMM dd, yyyy")
                                                            : "N/A"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {booking.check_in_date && booking.check_out_date
                                                            ? `${differenceInDays(
                                                                new Date(booking.check_out_date),
                                                                new Date(booking.check_in_date)
                                                            )} nights`
                                                            : ""}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <IconUsers className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>{booking.number_of_guests || 1} guest{booking.number_of_guests !== 1 ? "s" : ""}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-medium">₱{formatNumber(parseFloat(booking.selling_price || "0"))}</span>
                                            <span className="text-xs text-muted-foreground">{booking.payment_method || "Maya"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {booking.proof_of_payment_url && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(booking.proof_of_payment_url, '_blank');
                                                                }}
                                                                className="h-8 w-8"
                                                            >
                                                                <FileText className="h-4 w-4 text-primary" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View Receipt</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleQuickView(booking);
                                                            }}
                                                            className="h-8 w-8"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Quick View</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg">
                                {loading ? (
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                                        <span>Loading bookings...</span>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <AlertTriangle className="h-8 w-8 text-red-500" />
                                        <p className="text-red-500">{error}</p>
                                        <Button variant="outline" size="sm" onClick={fetchData}>
                                            <IconRefresh className="mr-2 h-4 w-4" />
                                            Retry
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                        <p>No bookings found</p>
                                        {searchQuery || statusFilter !== "all" || dateRange ? (
                                            <Button variant="outline" size="sm" onClick={resetFilters}>
                                                Clear Filters
                                            </Button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        <strong>
                            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                filteredData.length
                            )}
                        </strong>{" "}
                        of <strong>{filteredData.length}</strong> bookings
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Booking Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {filteredData[currentVoucherId]?.hotel_name || "Booking Details"}
                        </DialogTitle>
                        <DialogDescription>
                            Reference: {filteredData[currentVoucherId]?.reference_no || "N/A"}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Main booking content */}
                    {filteredData[currentVoucherId] && (
                        <div className="space-y-6">
                            {/* Hotel and Status Section */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium">{filteredData[currentVoucherId].hotel_name || "Unknown Hotel"}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center">
                                        <IconMapPin size={14} className="mr-1" />
                                        {filteredData[currentVoucherId].hotel_address || "Unknown Location"}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "whitespace-nowrap",
                                        filteredData[currentVoucherId].status === "Pending" && "border-amber-500 text-amber-700 bg-amber-50",
                                        filteredData[currentVoucherId].status === "Generated" && "border-green-500 text-green-700 bg-green-50",
                                        filteredData[currentVoucherId].status === "Rejected" && "border-red-500 text-red-700 bg-red-50"
                                    )}
                                >
                                    {filteredData[currentVoucherId].status === "Pending" && <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />}
                                    {filteredData[currentVoucherId].status === "Generated" && <CheckCircle className="mr-1 h-3 w-3 text-green-500" />}
                                    {filteredData[currentVoucherId].status === "Rejected" && <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />}
                                    {filteredData[currentVoucherId].status || "Unknown"}
                                </Badge>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Booking Information */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Booking Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Reference</h4>
                                                <p>{filteredData[currentVoucherId].reference_no || "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Booking ID</h4>
                                                <p>{filteredData[currentVoucherId].booking_id || "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Booking Date</h4>
                                                <p>
                                                    {filteredData[currentVoucherId].date_booked_request
                                                        ? format(new Date(filteredData[currentVoucherId].date_booked_request), "MMM dd, yyyy")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Check-in</h4>
                                                <p>
                                                    {filteredData[currentVoucherId].check_in_date
                                                        ? format(new Date(filteredData[currentVoucherId].check_in_date), "MMM dd, yyyy")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Check-out</h4>
                                                <p>
                                                    {filteredData[currentVoucherId].check_out_date
                                                        ? format(new Date(filteredData[currentVoucherId].check_out_date), "MMM dd, yyyy")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                                                <p>
                                                    {filteredData[currentVoucherId].check_in_date && filteredData[currentVoucherId].check_out_date
                                                        ? `${differenceInDays(
                                                            new Date(filteredData[currentVoucherId].check_out_date),
                                                            new Date(filteredData[currentVoucherId].check_in_date)
                                                        )} nights`
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Guests</h4>
                                                <p>{filteredData[currentVoucherId].number_of_guests || 1} guest{filteredData[currentVoucherId].number_of_guests !== 1 ? "s" : ""}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customer Information */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Guest Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                                                <p>
                                                    {filteredData[currentVoucherId].first_name || ""} {filteredData[currentVoucherId].last_name || ""}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                                <p>{filteredData[currentVoucherId].email_client || "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                                                <p>{filteredData[currentVoucherId].contact_number_client || "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Special Requests</h4>
                                                <p>{filteredData[currentVoucherId].special_requests || "None"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Price Information */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Price Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Selling Price</h4>
                                                <p className="font-medium text-lg">
                                                    {formatNumber(parseFloat(filteredData[currentVoucherId].selling_price || "0"))}
                                                </p>
                                            </div>
                                            {user?.role === "administrator" && (
                                                <>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
                                                        <p>₱{formatNumber(parseFloat(filteredData[currentVoucherId].purchase_price || "0"))}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-muted-foreground">Profit</h4>
                                                        <p className="text-green-600">
                                                            ₱
                                                            {formatNumber(
                                                                parseFloat(filteredData[currentVoucherId].selling_price || "0") -
                                                                parseFloat(filteredData[currentVoucherId].purchase_price || "0")
                                                            )}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Merchant Information */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Merchant Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Merchant</h4>
                                                <p>{filteredData[currentVoucherId].merchant_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                                <p>{filteredData[currentVoucherId].email_merchant || "N/A"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Additional Details Section - only show if there's data */}
                            {filteredData[currentVoucherId].additional_guests && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center">
                                            Additional Guests
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {(() => {
                                                try {
                                                    const additionalGuests = typeof filteredData[currentVoucherId].additional_guests === 'string'
                                                        ? JSON.parse(filteredData[currentVoucherId].additional_guests)
                                                        : filteredData[currentVoucherId].additional_guests;

                                                    if (!additionalGuests || additionalGuests.length === 0) {
                                                        return <p className="text-sm text-muted-foreground">No additional guests</p>;
                                                    }

                                                    return additionalGuests.map((guest: any, idx: number) => (
                                                        <div key={idx} className="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                    <User className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {guest.firstName && guest.lastName
                                                                            ? `${guest.firstName} ${guest.lastName}`
                                                                            : guest.firstName
                                                                                ? guest.firstName
                                                                                : `Guest ${idx + 1}`}
                                                                    </p>
                                                                    {guest.email && (
                                                                        <p className="text-xs text-muted-foreground">{guest.email}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ));
                                                } catch (e) {
                                                    return (
                                                        <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
                                                            <div className="text-center">
                                                                <p className="text-sm text-muted-foreground">No additional guest information available</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Rejection Reason - only show if status is Rejected */}
                            {filteredData[currentVoucherId].status === "Rejected" && filteredData[currentVoucherId].reason_of_rejected && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center text-red-700">
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Rejection Reason
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-red-700">{filteredData[currentVoucherId].reason_of_rejected}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* PDF Preview - only show if there's a PDF URL */}
                            {filteredData[currentVoucherId].pdf_url && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Hotel Itinerary PDF</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="aspect-[1/1.4] border rounded overflow-hidden">
                                            <iframe
                                                src={filteredData[currentVoucherId].pdf_url}
                                                className="w-full h-full"
                                                title="Hotel Itinerary"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Proof of Payment Section - Add after Additional Details Section */}
                            {filteredData[currentVoucherId].proof_of_payment_url && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Proof of Payment</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-md overflow-hidden">
                                            <Image
                                                src={filteredData[currentVoucherId].proof_of_payment_url}
                                                alt="Proof of Payment"
                                                width={600}
                                                height={400}
                                                className="w-full h-auto object-contain"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="mt-2 flex justify-end">
                                            <a
                                                href={filteredData[currentVoucherId].proof_of_payment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Full Image
                                                </Button>
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Dialog Footer with Actions */}
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Close
                        </Button>

                        {/* Status-specific actions */}
                        {filteredData[currentVoucherId]?.status === "Pending" && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setIsRejectDialogOpen(true);
                                    }}
                                >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>

                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setIsConfirmDialogOpen(true);
                                    }}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Generate Itinerary
                                </Button>
                            </>
                        )}

                        {filteredData[currentVoucherId]?.status === "Generated" && filteredData[currentVoucherId]?.pdf_url && (
                            <>
                                <a
                                    href={filteredData[currentVoucherId].pdf_url}
                                    download={`hotel_voucher_${filteredData[currentVoucherId].reference_no || "unknown"}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline">
                                        <IconDownload className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>
                                </a>

                                <Button onClick={handleSendEmail}>
                                    <IconSend className="mr-2 h-4 w-4" /> Resend to Client
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick View Modal */}
            <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                    </DialogHeader>
                    {quickViewBooking && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium">{quickViewBooking.hotel_name || "Unknown Hotel"}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center">
                                        <IconMapPin size={12} className="mr-1" />
                                        {quickViewBooking.hotel_address || "Unknown Address"}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "whitespace-nowrap",
                                        quickViewBooking.status === "Pending" && "border-amber-500 text-amber-700 bg-amber-50",
                                        quickViewBooking.status === "Generated" && "border-green-500 text-green-700 bg-green-50",
                                        quickViewBooking.status === "Rejected" && "border-red-500 text-red-700 bg-red-50"
                                    )}
                                >
                                    {quickViewBooking.status === "Pending" && <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />}
                                    {quickViewBooking.status === "Generated" && <CheckCircle className="mr-1 h-3 w-3 text-green-500" />}
                                    {quickViewBooking.status === "Rejected" && <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />}
                                    {quickViewBooking.status || "Unknown"}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Reference</h4>
                                    <p>{quickViewBooking.reference_no || "N/A"}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Booking Date</h4>
                                    <p>
                                        {quickViewBooking.date_booked_request
                                            ? format(new Date(quickViewBooking.date_booked_request), "MMM dd, yyyy")
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Check-in</h4>
                                    <p>
                                        {quickViewBooking.check_in_date
                                            ? format(new Date(quickViewBooking.check_in_date), "MMM dd, yyyy")
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Check-out</h4>
                                    <p>
                                        {quickViewBooking.check_out_date
                                            ? format(new Date(quickViewBooking.check_out_date), "MMM dd, yyyy")
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                                    <p>
                                        {quickViewBooking.check_in_date && quickViewBooking.check_out_date
                                            ? `${differenceInDays(
                                                new Date(quickViewBooking.check_out_date),
                                                new Date(quickViewBooking.check_in_date)
                                            )} nights`
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Guests</h4>
                                    <p>{quickViewBooking.number_of_guests || 1} guest{quickViewBooking.number_of_guests !== 1 ? "s" : ""}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium">Guest Information</h4>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                                        <p>
                                            {quickViewBooking.first_name || ""} {quickViewBooking.last_name || ""}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                        <p>{quickViewBooking.email_client || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                                        <p>{quickViewBooking.contact_number_client || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Special Requests</h4>
                                        <p>{quickViewBooking.special_requests || "None"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium">Pricing Information</h4>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Selling Price</h4>
                                        <p className="font-medium">
                                            ₱{formatNumber(parseFloat(quickViewBooking.selling_price || "0"))}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                                        <p>{quickViewBooking.payment_method || "Maya"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Amount Paid</h4>
                                        <p>
                                            {quickViewBooking.payment_method === "Credits"
                                                ? `₱${formatNumber(parseFloat(quickViewBooking.amount_paid || "0"))}`
                                                : `₱${formatNumber(parseFloat(quickViewBooking.selling_price || "0"))}`}
                                        </p>
                                    </div>
                                    {quickViewBooking.proof_of_payment_url && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Proof of Payment</h4>
                                            <a
                                                href={quickViewBooking.proof_of_payment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline inline-flex items-center"
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> View Receipt
                                            </a>
                                        </div>
                                    )}
                                    {user?.role === "administrator" && (
                                        <>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
                                                <p>₱{formatNumber(parseFloat(quickViewBooking.purchase_price || "0"))}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Profit</h4>
                                                <p className="text-green-600">
                                                    ₱{formatNumber(
                                                        parseFloat(quickViewBooking.selling_price || "0") -
                                                        parseFloat(quickViewBooking.purchase_price || "0")
                                                    )}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuickViewOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            // This ensures we get the right index
                            const index = filteredData.findIndex(b => b.id === quickViewBooking.id);
                            handleRowClick(quickViewBooking, index);
                        }}>
                            View Full Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Generate Voucher Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Hotel Itinerary</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to generate a hotel Itinerary for this booking?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-md bg-muted p-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <h4 className="text-sm font-medium">Hotel</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.hotel_name || "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Reference</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.reference_no || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Guest</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.first_name || ""}{" "}
                                        {filteredData[currentVoucherId]?.last_name || ""}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Dates</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.check_in_date
                                            ? format(new Date(filteredData[currentVoucherId]?.check_in_date), "MMM dd, yyyy")
                                            : "N/A"}{" "}
                                        -{" "}
                                        {filteredData[currentVoucherId]?.check_out_date
                                            ? format(new Date(filteredData[currentVoucherId]?.check_out_date), "MMM dd, yyyy")
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>
                                This will update the booking status to{" "}
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Generated
                                </Badge>
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <IconSend className="h-5 w-5 text-blue-500" />
                            <span>The Hotel Itinerary  will be available for email and download</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleConfirmGenerateVoucher}
                            disabled={isGeneratingVoucher}
                        >
                            {isGeneratingVoucher ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>Generate Itinerary</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Voucher Preview Dialog */}
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-5xl max-h-screen overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Hotel Itinerary Preview</DialogTitle>
                        <DialogDescription>
                            The Hotel Itinerary has been successfully generated. You can now preview, download, or send it to the client.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 my-4">
                        {pdfUrl && (
                            <iframe
                                src={pdfUrl}
                                className="w-full h-[500px] border rounded-md"
                                title="Hotel Itinerary Preview"
                            />
                        )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleClosePreview}>
                            Close
                        </Button>
                        <a
                            href={pdfUrl || ""}
                            download={`hotel_voucher_${filteredData[currentVoucherId]?.reference_no || "unknown"}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" className="w-full sm:w-auto">
                                <IconDownload className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                        </a>
                        <Button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail}
                            className="w-full sm:w-auto"
                        >
                            {isSendingEmail ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                </>
                            ) : (
                                <>
                                    <IconSend className="mr-2 h-4 w-4" /> Send to Client
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this booking. This will be shared with the merchant and client.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-md bg-muted p-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <h4 className="text-sm font-medium">Hotel</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.hotel_name || "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Reference</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.reference_no || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium">Guest</h4>
                                    <p className="text-sm">
                                        {filteredData[currentVoucherId]?.first_name || ""}{" "}
                                        {filteredData[currentVoucherId]?.last_name || ""}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reject-reason">Reason for Rejection</Label>
                            <textarea
                                id="reject-reason"
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-32"
                                placeholder="Please explain why this booking is being rejected..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!remarks.trim()}
                        >
                            Continue
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

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span>
                                This will update the booking status to{" "}
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    Rejected
                                </Badge>
                            </span>
                        </div>

                        <div className="rounded-md bg-muted p-4">
                            <h4 className="text-sm font-medium mb-2">Reason for Rejection:</h4>
                            <p className="text-sm whitespace-pre-wrap">{remarks}</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmReject}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export CSV Dialog */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Bookings Data</DialogTitle>
                        <DialogDescription>
                            Select which data you want to include in your export
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-md border p-4">
                            <h4 className="text-sm font-medium mb-2">Export Options</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="export-all" defaultChecked />
                                    <Label htmlFor="export-all">All bookings ({filteredData.length})</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="export-selected" disabled={selectedRows.length === 0} />
                                    <Label htmlFor="export-selected" className={selectedRows.length === 0 ? "text-muted-foreground" : ""}>
                                        Selected bookings only ({selectedRows.length})
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border p-4">
                            <h4 className="text-sm font-medium mb-2">Choose Columns</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-reference" defaultChecked />
                                    <Label htmlFor="col-reference">Reference</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-status" defaultChecked />
                                    <Label htmlFor="col-status">Status</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-hotel" defaultChecked />
                                    <Label htmlFor="col-hotel">Hotel Details</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-dates" defaultChecked />
                                    <Label htmlFor="col-dates">Booking Dates</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-guest" defaultChecked />
                                    <Label htmlFor="col-guest">Guest Information</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-price" defaultChecked />
                                    <Label htmlFor="col-price">Price Details</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-merchant" defaultChecked />
                                    <Label htmlFor="col-merchant">Merchant Data</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="col-timestamps" defaultChecked />
                                    <Label htmlFor="col-timestamps">Timestamps</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <CSVLink
                            data={filteredData.map((item) => ({
                                Reference: item.reference_no,
                                Status: item.status,
                                "Date Booked": item.date_booked_request,
                                "Hotel Name": item.hotel_name,
                                "Hotel Location": item.hotel_location,
                                "Check In": item.check_in_date,
                                "Check Out": item.check_out_date,
                                "Number of Nights": item.check_in_date && item.check_out_date
                                    ? differenceInDays(new Date(item.check_out_date), new Date(item.check_in_date))
                                    : "N/A",
                                "Client Name": `${item.first_name || ""} ${item.last_name || ""}`,
                                "Client Email": item.email_client,
                                "Number of Guests": item.number_of_guests,
                                "Merchant Name": item.merchant_name,
                                "Selling Price": item.selling_price,
                                "Purchase Price": item.purchase_price,
                                "Profit": (parseFloat(item.selling_price || "0") - parseFloat(item.purchase_price || "0")).toFixed(2),
                            }))}
                            filename={`hotel_bookings_export_${format(new Date(), "yyyy-MM-dd")}.csv`}
                            onClick={() => setIsExportDialogOpen(false)}
                        >
                            <Button className="bg-primary hover:bg-primary/90">
                                <IconFileTypeCsv className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                        </CSVLink>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}