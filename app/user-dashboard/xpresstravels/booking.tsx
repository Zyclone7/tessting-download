"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  IconPlaneTilt,
  IconBuildingSkyscraper,
  IconHistory,
  IconInfoCircle,
  IconCreditCard,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react"
import { useUserContext } from "@/hooks/use-user"
import { getUserProfile, updateProfile } from "@/actions/user"
import { BookingDetails } from "./booking-details-dialog"
import BookingHistory from "@/components/table/booking-history"
import { PaymentDialog } from "./payment-details"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import debounce from "lodash.debounce"
import TravelServiceGrid from "./TravelServiceGrid"
import { motion, AnimatePresence } from "framer-motion"
import { DateTimePickerForm } from "@/components/ui/date-time-picker"
import Logo from "@/public/images/XpressTravelName.png"
import { getAllAirport, isPNRBooked } from "@/actions/booking"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { HotelBookingDetails } from "./hotel-booking-details";
import { HotelPaymentDialog } from "./hotel-payment-details";
import HotelBookingHistory from "@/components/table/hotel-booking-history";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";




interface FlightDetails {
  title: string
  first_name: string
  last_name: string
  middle_name: string
  email_merchant: string
  email_client: string
  contact_number_merchant: string
  provider: string
  purchase_price: number
  selling_price: number
  amount_paid: number
  pnr: string
  typeOfTravel: string
  flight_class_depart: string
  departure_airport: string
  departure_date: string
  destination_airport: string
  destination_date: string
  airline_select: string
  airline_bus: string
  baggage_kilogram?: number
  return_flight_class?: string
  return_departure_airport?: string
  return_departure_date?: string
  return_destination_airport?: string
  return_destination_date?: string
  return_airline?: string
  return_airline_bus?: string
  pdf_url?: string | null
  travel_agency_name?: string
  travel_agency_address?: string
  travel_agency_number?: string
  social_media_page?: string
}

// Enhanced Carousel Component
const EnhancedCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const timerRef = useRef<any | null>(null)

  // Sample images - replace with your actual service center images
  const images = ["/images/c1.png", "/images/c2.png", "/images/c3.jpg", "/images/c4.jpg"]

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  // Auto-advance carousel every 10 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      nextSlide()
    }, 10000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [nextSlide])

  // Reset timer when manually changing slides
  const handleManualChange = (callback: () => void) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    callback()
    timerRef.current = setInterval(() => {
      nextSlide()
    }, 10000)
  }

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />

      {/* Carousel Content */}
      <div className="relative h-full w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={images[currentSlide] || "/placeholder.svg"}
              alt={`Service Center Image ${currentSlide + 1}`}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => handleManualChange(prevSlide)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
        aria-label="Previous slide"
      >
        <IconChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={() => handleManualChange(nextSlide)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
        aria-label="Next slide"
      >
        <IconChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualChange(() => setCurrentSlide(index))}
            className={`h-2 rounded-full transition-all duration-300 ${currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Promotional Text Overlay */}
      <div className="absolute bottom-10 left-10 z-20 max-w-md text-white">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold mb-2 drop-shadow-lg"
        >
          Premium Travel Services
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-sm text-white/90 drop-shadow-md"
        >
          Experience world-class service and exclusive deals for your next journey
        </motion.p>
      </div>
    </div>
  )
}

export function Booking({ }) {
  const [activeTab, setActiveTab] = useState("airline_booking")
  const { user, updateUserField } = useUserContext();
  const { toast } = useToast()
  const [formProgress, setFormProgress] = useState(0)
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [travelLogo, setTravelLogo] = useState<string | null>(null);
  const [travelLogoUrl, setTravelLogoUrl] = useState<string | null>(user?.travel_logo_url || null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Form data for airline and hotel booking
  const [airlineFormData, setAirlineFormData] = useState<FlightDetails>({
    title: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email_merchant: user?.email || "",
    email_client: "",
    contact_number_merchant: user?.contact_number || "",
    provider: "",
    purchase_price: 0,
    selling_price: 0,
    amount_paid: 0,
    pnr: "",
    typeOfTravel: "one-way",
    flight_class_depart: "",
    departure_airport: "",
    departure_date: "",
    destination_airport: "",
    destination_date: "",
    airline_select: "",
    airline_bus: "",
    baggage_kilogram: 0,
    return_flight_class: "",
    return_departure_airport: "",
    return_departure_date: "",
    return_destination_airport: "",
    return_destination_date: "",
    return_airline: "",
    return_airline_bus: "",
    travel_agency_name: user?.travel_agency || "",
    travel_agency_address: user?.business_address || "",
    social_media_page: user?.social_media_page || "",
  })

  const [hotelFormData, setHotelFormData] = useState({
    hotelName: "",
    location: "",
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    roomType: "",
  })

  const handleLogoClick = () => {
    logoFileInputRef.current?.click();
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Logo size should be less than 5MB",
        variant: "destructive",
      });
      setIsUploadingLogo(false);
      return;
    }

    try {
      // Create a preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTravelLogo(result); // Set preview image
      };
      reader.readAsDataURL(file);

      // Upload to Blob storage
      const blobFormData = new FormData();
      blobFormData.append("file", file);

      const blobUploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: blobFormData,
      });

      const blobResult = await blobUploadResponse.json();

      if (blobUploadResponse.ok && blobResult.url) {
        // Set the actual URL from Blob storage
        const logoUrl = blobResult.url;
        setTravelLogoUrl(logoUrl);

        // Update in user context/profile
        if (user?.id) {
          const updateResult = await updateProfile({
            ID: user.id,
            travel_logo_url: logoUrl
          });

          if (updateResult.success) {
            updateUserField("travel_logo_url", logoUrl);
            toast({
              title: "Success",
              description: "Travel logo updated successfully",
            });
          }
        }
      } else {
        throw new Error(blobResult.error || "Failed to upload travel logo.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload travel logo. Please try again.",
        variant: "destructive",
      });
      // Revert to original image if upload fails
      setTravelLogo(null);
      setTravelLogoUrl(user?.travel_logo_url || null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        if (user) {
          const profileResult = await getUserProfile(user.id.toString());
          if (profileResult.success && profileResult.data) {
            setProfile(profileResult.data);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = [
      "first_name",
      "last_name",
      "email_client",
      "pnr",
      "flight_class_depart",
      "departure_airport",
      "departure_date",
      "destination_airport",
      "destination_date",
      "airline_select",
      "email_merchant",
      "contact_number_merchant",
      "provider",
      "selling_price",
    ]

    let filledFields = 0
    requiredFields.forEach((field) => {
      if (airlineFormData[field as keyof FlightDetails]) {
        filledFields++
      }
    })

    // Add round-trip fields if applicable
    if (airlineFormData.typeOfTravel === "round-trip") {
      const roundTripFields = [
        "return_flight_class",
        "return_departure_airport",
        "return_departure_date",
        "return_destination_airport",
        "return_destination_date",
      ]

      const totalFields = requiredFields.length + roundTripFields.length

      roundTripFields.forEach((field) => {
        if (airlineFormData[field as keyof FlightDetails]) {
          filledFields++
        }
      })

      setFormProgress(Math.floor((filledFields / totalFields) * 100))
    } else {
      setFormProgress(Math.floor((filledFields / requiredFields.length) * 100))
    }
  }, [airlineFormData])

  return (
    <div className="bg-gradient-to-b from-sky-50 to-white">
      {/* Header with Logo and Gradient Bar */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center pt-4"
        >
          <Image
            src={Logo || "/placeholder.svg"}
            height={220}
            width={220}
            alt="Xpress Travel Logo"
            className="object-contain"
          />
        </motion.div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full h-2 rounded-full bg-gradient-to-r from-[#3D89D6] to-[#1A5EA2] border-0 mt-2"
        />
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ minHeight: "78vh" }}>
          {/* Carousel Section - Takes 5/12 of the width on large screens */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-5"
            style={{ height: "calc(80vh - 40px)" }}
          >
            <EnhancedCarousel />
          </motion.div>

          {/* Form Section - Takes 7/12 of the width on large screens */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="lg:col-span-7"
            style={{ height: "calc(80vh - 40px)" }}
          >
            <Card className="w-full bg-white shadow-lg rounded-xl border-t-4 border-t-[#3D89D6] h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  {/* Left side content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl font-bold text-[#1A5EA2]">Travel Booking System</CardTitle>

                      {user?.travel_agency && (
                        <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                          {user.travel_agency}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col mt-1">
                      <CardDescription>
                        Book flights and hotels with ease through our streamlined booking system
                      </CardDescription>
                    </div>
                  </div>

                  {/* Right side logo */}
                  <div className="flex-shrink-0 ml-4">
                    <div className="relative flex items-center justify-center cursor-pointer" onClick={handleLogoClick}>
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <div className="relative flex flex-col items-center justify-center">
                        {isUploadingLogo ? (
                          <div className="h-16 w-16 flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                          </div>
                        ) : (
                          <Avatar className="h-16 w-16 rounded-full border-2 border-blue-500">
                            <AvatarImage
                              src={travelLogoUrl || user?.travel_logo_url || ""}
                              alt="Travel Agency Logo"
                              className="object-cover"
                              onError={(e) => {
                                console.error("Logo failed to load:", travelLogoUrl || user?.travel_logo_url);
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <AvatarFallback className="bg-white/20 text-white">
                              {user?.travel_agency?.charAt(0)?.toUpperCase() || "T"}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                          <div className="text-white text-xs font-medium text-center">
                            {travelLogoUrl ? "Change Logo" : "Upload Logo"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Progress Indicator */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Form Completion</span>
                    <span>{formProgress}%</span>
                  </div>
                  <Progress value={formProgress} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="pt-4 overflow-y-auto flex-grow" style={{ height: "calc(80vh - 160px)" }}>
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger
                      value="list_of_provider"
                      className={`flex items-center justify-center gap-2 rounded-md transition-all duration-200 ${activeTab === "list_of_provider" ? "bg-[#3D89D6] text-white shadow-md" : "hover:bg-slate-200"
                        }`}
                    >
                      <IconInfoCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">PROVIDERS</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="airline_booking"
                      className={`flex items-center justify-center gap-2 rounded-md transition-all duration-200 ${activeTab === "airline_booking" ? "bg-[#3D89D6] text-white shadow-md" : "hover:bg-slate-200"
                        }`}
                    >
                      <IconPlaneTilt className="w-5 h-5" />
                      <span className="hidden sm:inline">AIRLINE BOOKING</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="hotel_booking"
                      className={`flex items-center justify-center gap-2 rounded-md transition-all duration-200 ${activeTab === "hotel_booking" ? "bg-[#3D89D6] text-white shadow-md" : "hover:bg-slate-200"
                        }`}
                    >
                      <IconBuildingSkyscraper className="w-5 h-5" />
                      <span className="hidden sm:inline">HOTEL BOOKING</span>
                    </TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TabsContent value="airline_booking" className="mt-0 h-full overflow-y-auto">
                        <AirlineBookingForm formData={airlineFormData} setFormData={setAirlineFormData} />
                      </TabsContent>
                      <TabsContent value="hotel_booking" className="mt-0 h-full overflow-y-auto">
                        <HotelBookingForm
                          formData={hotelFormData as unknown as HotelFormData}
                          setFormData={setHotelFormData as unknown as React.Dispatch<React.SetStateAction<HotelFormData>>} />
                      </TabsContent>
                      <TabsContent value="list_of_provider" className="mt-0 h-full overflow-y-auto">
                        <div className="p-4 bg-white rounded-lg">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-semibold text-[#1A5EA2]">Our Travel Partners</h3>
                              <div className="relative">
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="search"
                                    placeholder="Search providers..."
                                    className="w-full max-w-[200px] bg-white"
                                  />
                                  <Button size="sm" className="bg-[#3D89D6] hover:bg-[#1A5EA2]">
                                    Search
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-600">
                              Browse our trusted travel service providers for your next journey.
                            </p>
                            <TravelServiceGrid />
                          </div>
                        </div>
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export const AirlineBookingForm = ({
  formData,
  setFormData,
}: {
  formData: FlightDetails
  setFormData: React.Dispatch<React.SetStateAction<FlightDetails>>
}) => {
  const [pnrError, setPnrError] = useState<string>("")
  const { user } = useUserContext()
  const [isBookingHistoryOpen, setIsBookingHistoryOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [userCredit, setUserCredit] = useState<number>(0)
  const [, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [airports, setAirports] = useState<{ id: number; name: string; location: string }[]>([])
  const [userKyc, setUserKyc] = useState("0")
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [customAirline, setCustomAirline] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Debounced validation for the PNR field
  const validatePNR = useCallback(
    debounce(async (pnrValue: string) => {
      try {
        if (pnrValue.trim() !== "") {
          const exists = await isPNRBooked(pnrValue)
          if (exists) {
            setPnrError("This PNR is already booked. Kindly check again.")
          } else {
            setPnrError("")
          }
        }
      } catch (error) {
        console.error("Error validating PNR:", error)
      }
    }, 500),
    [],
  )

  // fetch users credit
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)

      if (user && user.id) {
        try {
          // Directly call the Server Action
          const response = await getUserProfile(user.id.toString())

          if (response.success) {
            setUserCredit(response.data?.user_credits || 0)
          } else {
            setError(response.message || "Failed to fetch user credit.")
            toast({
              title: "Error",
              description: response.message || "Failed to fetch user credit.",
              variant: "destructive",
            })
          }
        } catch (err) {
          console.error("Error fetching profile:", err)
          setError("An unexpected error occurred. Please try again later.")
          toast({
            title: "Error",
            description: "Failed to fetch user credit. Please try again later.",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProfile()
  }, [user, toast])

  // fetch airports
  useEffect(() => {
    const fetchAirports = async () => {
      const response = await getAllAirport()
      if (response.success) {
        if (response.data) {
          const mappedAirports = response.data.map((airport: any) => ({
            id: airport.id,
            name: airport.name || "",
            location: airport.location || "",
          }))
          setAirports(mappedAirports)
        }
      } else {
        console.error("Failed to fetch airports:", response.message)
      }
    }

    fetchAirports()
  }, [])

  // Handle opening and closing of booking history dialog
  const handleBookingHistoryOpen = () => {
    setIsBookingHistoryOpen(true)
    setIsDialogOpen(false) // Ensure booking details dialog is closed
  }

  // Handle closing of booking history dialog
  const handleBookingHistoryClose = () => {
    setIsBookingHistoryOpen(false)
  }

  //  handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    // Ensure we're properly updating the form data
    setFormData((prev) => ({ ...prev, [id]: value }))

    // If the changed field is 'pnr', validate it
    if (id === "pnr") {
      validatePNR(value)
    }
  }

  // handle booking details form submit dialog
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Only show the booking details dialog if we're on the final step AND all required fields are filled
    if (currentStep === totalSteps) {
      // Check if all required fields in step 4 are filled
      const requiredStep4Fields = ["provider", "selling_price"]
      const isStep4Complete = requiredStep4Fields.every((field) => formData[field as keyof FlightDetails])

      if (isStep4Complete) {
        setIsDialogOpen(true)
      } else {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields before submitting.",
          variant: "destructive",
        })
      }
    } else {
      // If not on the final step, just move to the next step
      nextStep()
    }
  }

  // handle confirm booking dialog
  const handleConfirmBooking = () => {
    setIsDialogOpen(false)
    setIsPaymentDialogOpen(true)
  }

  // handle booking success form data
  const handleBookingSuccess = () => {
    setFormData({
      title: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      email_merchant: user?.email || "",
      email_client: "",
      contact_number_merchant: user?.contact_number || "",
      provider: "",
      purchase_price: 0,
      selling_price: 0,
      amount_paid: 0,
      pnr: "",
      typeOfTravel: "one-way",
      flight_class_depart: "",
      departure_airport: "",
      departure_date: "",
      destination_airport: "",
      destination_date: "",
      airline_select: "",
      airline_bus: "",
      return_flight_class: "",
      return_departure_airport: "",
      return_departure_date: "",
      return_destination_airport: "",
      return_destination_date: "",
      return_airline: "",
      return_airline_bus: "",
      travel_agency_name: user?.travel_agency || "",
      travel_agency_address: user?.business_address || "",
      social_media_page: user?.social_media_page || "",
    })
    setIsPaymentDialogOpen(false)
    setCurrentStep(1)
    toast({
      title: "Booking Successful",
      description: "Your booking has been successfully processed.",
      variant: "default",
    })
  }

  const handleDateTimeChange = (fieldName: string, date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [fieldName]: date }))
  }

  const handleAirlineChange = (value: string) => {
    if (value !== "Other") {
      setFormData((prev) => ({ ...prev, airline_select: value }))
      setShowOtherInput(false)
    } else {
      setShowOtherInput(true)
      setFormData((prev) => ({ ...prev, airline_select: "" }))
    }
  }

  const handleCustomAirlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomAirline(value)
    setFormData((prev) => ({ ...prev, airline_select: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Save current form data before moving to next step
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      // Preserve form data when going back
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header with Step Indicator and Booking History Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#1A5EA2]">
            {currentStep === 1 && "Passenger Details"}
            {currentStep === 2 && "Flight Details"}
            {currentStep === 3 && "Contact Information"}
            {currentStep === 4 && "Pricing Details"}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-sm text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">
                  Step {currentStep} of {totalSteps}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete all steps to submit your booking</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button
          className="flex items-center gap-2 bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors"
          onClick={handleBookingHistoryOpen}
          type="button"
        >
          <IconHistory className="w-4 h-4" />
          <span>Booking History</span>
        </Button>
      </div>

      {/* Booking History Dialog */}
      <Dialog
        open={isBookingHistoryOpen}
        onOpenChange={(open) => {
          setIsBookingHistoryOpen(open)
          if (open) {
            setIsDialogOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A5EA2] flex items-center gap-2">
              <IconHistory className="w-5 h-5" />
              Booking History
            </DialogTitle>
            <DialogDescription>View and manage all your previous bookings</DialogDescription>
          </DialogHeader>
          <BookingHistory onClose={handleBookingHistoryClose} />
        </DialogContent>
      </Dialog>

      {/* Multi-step Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Passenger Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="font-medium">
                        Title
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: value.replace(
                              /\w\S*/g,
                              (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
                            ),
                          }))
                        }
                      >
                        <SelectTrigger id="title" className="bg-white">
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="mr.">Mr.</SelectItem>
                          <SelectItem value="ms.">Ms.</SelectItem>
                          <SelectItem value="mrs.">Mrs.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        placeholder="Enter last name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="font-medium">
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        placeholder="Enter first name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middle_name" className="font-medium">
                        Middle Name (optional)
                      </Label>
                      <Input
                        id="middle_name"
                        placeholder="Enter middle name"
                        value={formData.middle_name}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="email_client" className="font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email_client"
                        type="email"
                        placeholder="Enter passenger's email address"
                        value={formData.email_client}
                        onChange={handleInputChange}
                        className="bg-white"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Your booking details will be sent to this email address
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Flight Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="pnr" className="font-medium">
                        PNR (Passenger Name Record)
                      </Label>
                      <Input
                        id="pnr"
                        placeholder="Enter PNR"
                        value={formData.pnr}
                        onChange={handleInputChange}
                        className="bg-white"
                        required
                      />
                      {pnrError && <div className="text-red-500 text-sm mt-1">{pnrError}</div>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flight_class_depart" className="font-medium">
                        Flight Class
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            flight_class_depart: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger id="flight_class_depart" className="bg-white">
                          <SelectValue placeholder="Select Flight Class" />
                        </SelectTrigger>
                        <SelectContent id="flight_class_depart">
                          <SelectItem value="economy_class">Economy Class</SelectItem>
                          <SelectItem value="premium_economy_class">Premium Economy Class</SelectItem>
                          <SelectItem value="business_class">Business Class</SelectItem>
                          <SelectItem value="first_class">First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Trip Type</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="one-way"
                            name="typeOfTravel"
                            value="one-way"
                            checked={formData.typeOfTravel === "one-way"}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                typeOfTravel: e.target.value,
                              }))
                            }
                            className="form-radio h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="one-way" className="ml-2">
                            One-way
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="round-trip"
                            name="typeOfTravel"
                            value="round-trip"
                            checked={formData.typeOfTravel === "round-trip"}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                typeOfTravel: e.target.value,
                              }))
                            }
                            className="form-radio h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="round-trip" className="ml-2">
                            Round-trip
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3 text-[#1A5EA2]">Departure Flight</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="departure_airport" className="font-medium">
                          Departure Airport
                        </Label>
                        <Select
                          onValueChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              departure_airport: value,
                            }))
                          }}
                          required
                        >
                          <SelectTrigger id="departure_airport" className="bg-white">
                            <SelectValue placeholder="Select Departure Airport" />
                          </SelectTrigger>
                          <SelectContent>
                            {airports.map((airport) => (
                              <SelectItem key={airport.id} value={airport.id.toString()}>
                                {airport.name}, {airport.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="departure_date" className="font-medium">
                          Departure Date and Time
                        </Label>
                        <div className="flex items-center">
                          <DateTimePickerForm
                            value={formData.departure_date}
                            onChange={(date) => handleDateTimeChange("departure_date", date)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destination_airport" className="font-medium">
                          Destination Airport
                        </Label>
                        <Select
                          onValueChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              destination_airport: value,
                            }))
                          }}
                          required
                        >
                          <SelectTrigger id="destination_airport" className="bg-white">
                            <SelectValue placeholder="Select Destination Airport" />
                          </SelectTrigger>
                          <SelectContent>
                            {airports.map((airport) => (
                              <SelectItem key={airport.id} value={airport.id.toString()}>
                                {airport.name}, {airport.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destination_date" className="font-medium">
                          Destination Date and Time
                        </Label>
                        <DateTimePickerForm
                          value={formData.destination_date}
                          onChange={(date) => handleDateTimeChange("destination_date", date)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="airline_select" className="font-medium">
                          Select Airline
                        </Label>
                        <Select onValueChange={handleAirlineChange} required>
                          <SelectTrigger id="airline_select" className="bg-white">
                            <SelectValue placeholder="Select Airline" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Philippine Airlines">Philippine Airlines</SelectItem>
                            <SelectItem value="Cebu Pacific">Cebu Pacific</SelectItem>
                            <SelectItem value="AirAsia Philippines">AirAsia Philippines</SelectItem>
                            <SelectItem value="PAL Express">PAL Express</SelectItem>
                            <SelectItem value="Other">Other (Please specify)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {showOtherInput && (
                        <div className="space-y-2">
                          <Label htmlFor="custom_airline" className="font-medium">
                            Please specify airline
                          </Label>
                          <Input
                            id="custom_airline"
                            placeholder="Enter airline name"
                            value={customAirline}
                            onChange={handleCustomAirlineChange}
                            className="bg-white"
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="baggage_kilogram" className="font-medium">
                          Baggage Weight (kg)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          id="baggage_kilogram"
                          name="baggage_kilogram"
                          onChange={handleInputChange}
                          className="bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {formData.typeOfTravel === "round-trip" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6"
                    >
                      <h4 className="text-md font-semibold mb-3 text-[#1A5EA2]">Return Flight</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="return_flight_class" className="font-medium">
                            Return Flight Class
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                return_flight_class: value,
                              }))
                            }
                            required
                          >
                            <SelectTrigger id="return_flight_class" className="bg-white">
                              <SelectValue placeholder="Select Flight Class" />
                            </SelectTrigger>
                            <SelectContent id="return_flight_class">
                              <SelectItem value="economy_class">Economy Class</SelectItem>
                              <SelectItem value="premium_economy_class">Premium Economy Class</SelectItem>
                              <SelectItem value="business_class">Business Class</SelectItem>
                              <SelectItem value="first_class">First Class</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="return_departure_airport" className="font-medium">
                            Return Departure Airport
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                return_departure_airport: value,
                              }))
                            }
                            required
                          >
                            <SelectTrigger id="return_departure_airport" className="bg-white">
                              <SelectValue placeholder="Select Return Departure Airport" />
                            </SelectTrigger>
                            <SelectContent>
                              {airports.map((airport) => (
                                <SelectItem key={airport.id} value={airport.id.toString()}>
                                  {airport.name}, {airport.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="return_departure_date" className="font-medium">
                            Return Departure Date
                          </Label>
                          <DateTimePickerForm
                            value={formData.return_departure_date}
                            onChange={(date) => handleDateTimeChange("return_departure_date", date)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="return_destination_airport" className="font-medium">
                            Return Destination Airport
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                return_destination_airport: value,
                              }))
                            }
                            required
                          >
                            <SelectTrigger id="return_destination_airport" className="bg-white">
                              <SelectValue placeholder="Select Return Destination Airport" />
                            </SelectTrigger>
                            <SelectContent>
                              {airports.map((airport) => (
                                <SelectItem key={airport.id} value={airport.id.toString()}>
                                  {airport.name}, {airport.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="return_destination_date" className="font-medium">
                            Return Destination Date
                          </Label>
                          <DateTimePickerForm
                            value={formData.return_destination_date}
                            onChange={(date) => handleDateTimeChange("return_destination_date", date)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  <h4 className="text-md font-semibold mb-3 text-[#1A5EA2]">
                    Merchant's/Distributor's Contact Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 hidden">
                    <div className="space-y-2">
                      <Label htmlFor="email_merchant" className="font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email_merchant"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email_merchant}
                        onChange={handleInputChange}
                        className="bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_number_merchant" className="font-medium">
                        Mobile Number
                      </Label>
                      <Input
                        id="contact_number_merchant"
                        type="tel"
                        placeholder="Enter mobile number"
                        value={formData.contact_number_merchant}
                        onChange={handleInputChange}
                        className="bg-white"
                        required
                      />
                    </div>
                  </div>

                  {user?.travel_agency && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <h5 className="text-sm font-medium text-blue-700 mb-2">Agency Information</h5>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                        <div>
                          <span className="font-medium">Agency Name:</span> {user.travel_agency}
                        </div>
                        {user.business_address && (
                          <div>
                            <span className="font-medium">Address:</span> {user.business_address}
                          </div>
                        )}
                        {user.social_media_page && (
                          <div>
                            <span className="font-medium">Social Media:</span> {user.social_media_page}
                          </div>
                        )}
                        {user.email && (
                          <div>
                            <span className="font-medium">Email:</span> {user.email}
                          </div>
                        )}
                        {user.contact_number && (
                          <div>
                            <span className="font-medium">Contact Number:</span> {user.contact_number}
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Pricing Details */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="provider" className="font-medium">
                        Provider
                      </Label>
                      <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, provider: value }))} required>
                        <SelectTrigger id="provider" className="bg-white">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent id="provider">
                          <SelectItem value="12go">12go</SelectItem>
                          <SelectItem value="2GoTravel">2GoTravel</SelectItem>
                          <SelectItem value="Agoda">Agoda</SelectItem>
                          <SelectItem value="Air Asia">Air Asia</SelectItem>
                          <SelectItem value="Airpaz">Airpaz</SelectItem>
                          <SelectItem value="Cebu Pacific">Cebu Pacific</SelectItem>
                          <SelectItem value="Kiwi">Kiwi</SelectItem>
                          <SelectItem value="ly.com">ly.com</SelectItem>
                          <SelectItem value="PAL">PAL</SelectItem>
                          <SelectItem value="Traveloka">Traveloka</SelectItem>
                          <SelectItem value="Trip">Trip</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price" className="font-medium">
                        Purchase Price
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                        <Input
                          id="purchase_price"
                          type="number"
                          placeholder="Enter purchase price"
                          value={formData.purchase_price || ""}
                          onChange={handleInputChange}
                          className="pl-7 bg-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="selling_price" className="font-medium">
                        Selling Price
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                        <Input
                          id="selling_price"
                          type="number"
                          placeholder="Enter selling price"
                          value={formData.selling_price || ""}
                          onChange={handleInputChange}
                          className="pl-7 bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {userCredit > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-green-700">Available Credit</h5>
                          <p className="text-sm text-green-600">You have ₱{userCredit.toFixed(2)} credit available</p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          <IconCreditCard className="w-3 h-3 mr-1" /> Credit Available
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="border-[#3D89D6] text-[#3D89D6] hover:bg-[#3D89D6] hover:text-white transition-colors"
        >
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button type="button" onClick={nextStep} className="bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors">
            Next
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} className="bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors">
            Submit Booking
          </Button>
        )}
      </div>

      {/* Dialogs */}
      {formData && (
        <>
          <BookingDetails
            open={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            bookingDetails={formData}
            onConfirm={handleConfirmBooking}
          />
          <PaymentDialog
            open={isPaymentDialogOpen}
            onClose={() => setIsPaymentDialogOpen(false)}
            bookingDetails={formData}
            onBookingSuccess={handleBookingSuccess}
            userCredit={userCredit}
          />
        </>
      )}
    </div>
  )
}

// Hotel Booking Form but not yet implemented
interface HotelFormData {
  // Core fields that match pt_xpresshotel table
  uid?: number;
  hotelName: string;
  location?: string; // Alternative name for destination
  hotelAddress?: string;
  contactNumber?: string; // Maps to hotel_contact
  bookingId?: string; // For reference purposes

  // Stay details
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  roomType: string;

  // Guest information
  title?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string; // Maps to email_client
  phoneNumber?: string;

  // Merchant details
  email_merchant?: string;
  contact_number_merchant?: string;

  // Pricing
  basePrice?: string | number; // Maps to purchase_price
  sellingPrice?: string | number;
  amountPaid?: string | number;
  paymentMethod?: string;
  proofOfPaymentUrl?: string;

  // Agency information
  travel_agency_name?: string;
  travel_agency_address?: string;
  travel_agency_number?: string;
  social_media_page?: string;

  // Special fields
  specialRequests?: string;
  provider?: string;

  // For flexibility
  [key: string]: any;
}

// Define guest interface to match server-side GuestInfo type
interface AdditionalGuest {
  title: string;
  firstName: string;
  lastName: string;
}

export const HotelBookingForm = ({
  formData,
  setFormData,
}: {
  formData: HotelFormData
  setFormData: React.Dispatch<React.SetStateAction<HotelFormData>>
}) => {
  const { user } = useUserContext()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([])
  const [isBookingDetailsDialogOpen, setIsBookingDetailsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [userCredit, setUserCredit] = useState(0)
  const [isHotelBookingHistoryOpen, setIsHotelBookingHistoryOpen] = useState(false)
  const totalSteps = 4
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Add a handler to open the dialog
  const handleHotelBookingHistoryOpen = () => {
    setIsHotelBookingHistoryOpen(true)
  }

  // Add a handler to close the dialog
  const handleHotelBookingHistoryClose = () => {
    setIsHotelBookingHistoryOpen(false)
  }

  // Synchronize location and destination fields if needed
  useEffect(() => {
    // Initialize any missing required fields
    const initializedData: Partial<HotelFormData> = {}
    const requiredFields = [
      "title",
      "firstName",
      "lastName",
      "email",
      "email_merchant",
      "contact_number_merchant",
      "hotelAddress",
      "basePrice",
      "sellingPrice",
      "phoneNumber",
      "bookingId",
    ]

    let needsUpdate = false
    requiredFields.forEach((field) => {
      if (formData[field] === undefined) {
        initializedData[field as keyof HotelFormData] = ""
        needsUpdate = true
      }
    })

    // Ensure UID is set from user context
    if (user?.id && !formData.uid) {
      initializedData.uid = user.id
      needsUpdate = true
    }

    if (needsUpdate) {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        ...initializedData,
      }))
    }
  }, [formData, user?.id, setFormData])

  // Fetch user credits
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile(user?.id?.toString() || "")
        if (response.success) {
          setUserCredit(response.data?.user_credits || 0)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    if (user?.id) {
      fetchUserProfile()
    }
  }, [user])

  // Update travel agency details from user context when it changes
  useEffect(() => {
    if (user) {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        uid: user.id,
        travel_agency_name: user?.travel_agency || "",
        travel_agency_address: user?.business_address || "",
        travel_agency_number: user?.contact_number || "",
        social_media_page: user?.social_media_page || "",
        // Set merchant details to be same as travel agency info by default
        email_merchant: user?.email || prev.email_merchant || "",
        contact_number_merchant: user?.contact_number || prev.contact_number_merchant || "",
      }))
    }
  }, [user, setFormData])

  // Set default check-in/out times
  useEffect(() => {
    if (!formData.checkInTime) {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        checkInTime: "14:00", // Default check-in at 2pm
      }))
    }
    if (!formData.checkOutTime) {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        checkOutTime: "12:00", // Default check-out at 12pm
      }))
    }
  }, [formData.checkInTime, formData.checkOutTime, setFormData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target

    // Clear error for this field when user starts typing
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: "" }))
    }

    // Handle field mappings
    if (id === "location") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        location: value,
        hotel_location: value, // Update server-side field name too
      }))
    } else if (id === "hotelName") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        hotelName: value,
        hotel_name: value, // Update server-side field name
      }))
    } else if (id === "hotelAddress") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        hotelAddress: value,
        hotel_address: value, // Update server-side field name
      }))
    } else if (id === "contactNumber") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        contactNumber: value,
        hotel_contact: value, // Update server-side field name
      }))
    } else if (id === "basePrice") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        basePrice: value,
        purchase_price: value, // Update server-side field name
      }))
    } else if (id === "email") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        email: value,
        email_client: value, // Update server-side field name
      }))
    } else if (id === "phoneNumber") {
      setFormData((prev: HotelFormData) => ({
        ...prev,
        phoneNumber: value,
        contact_number_client: value, // Update server-side field name
      }))
    } else if (id === "contact_number_merchant") {
      // Direct handling of contact_number_merchant field
      setFormData((prev: HotelFormData) => ({
        ...prev,
        contact_number_merchant: value,
      }))
    } else {
      setFormData((prev: HotelFormData) => ({ ...prev, [id]: value }))
    }
  }

  const handleAdditionalGuestChange = (index: number, field: string, value: string) => {
    const updatedGuests = [...additionalGuests]
    updatedGuests[index] = { ...updatedGuests[index], [field]: value }
    setAdditionalGuests(updatedGuests)
  }

  const addGuest = () => {
    setAdditionalGuests([...additionalGuests, { title: "", firstName: "", lastName: "" }])
  }

  const removeGuest = (index: number) => {
    const updatedGuests = [...additionalGuests]
    updatedGuests.splice(index, 1)
    setAdditionalGuests(updatedGuests)
  }

  const validateStep = (step: number) => {
    let isValid = true
    const errors: Record<string, string> = {}

    if (step === 1) {
      // Validate Hotel Details
      if (!formData.hotelName?.trim()) {
        errors.hotelName = "Hotel name is required"
        isValid = false
      }
      if (!formData.bookingId?.trim()) {
        errors.bookingId = "Booking ID is required"
        isValid = false
      }
      if (!formData.hotelAddress?.trim()) {
        errors.hotelAddress = "Hotel address is required"
        isValid = false
      }
    }
    // Add validation for other steps as needed

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const requiredFields = [
      "hotelName",
      "hotelAddress",
      "bookingId",
      "checkInDate",
      "checkOutDate",
      "roomType",
      "firstName",
      "lastName",
      "email",
      "email_merchant",
      "contact_number_merchant",
      "basePrice",
      "sellingPrice",
      "phoneNumber",
    ]

    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in the following fields: ${missingFields.join(", ")}`,
        variant: "default",
      })
      return
    }

    // Calculate total guests (primary + additional)
    const numberOfGuests = 1 + additionalGuests.length

    // Create complete submission data with all required server fields
    const submissionData = {
      ...formData,
      // Core data mappings to match server-side field names
      uid: user?.id || 0,
      hotel_name: formData.hotelName,
      hotel_location: formData.location,
      hotel_address: formData.hotelAddress,
      hotel_contact: formData.contactNumber,
      booking_id: formData.bookingId,

      // User details
      email_client: formData.email,
      contact_number_client: formData.phoneNumber,

      // Make sure contact_number_merchant is properly mapped
      contact_number_merchant: formData.contact_number_merchant || "", // Ensure it's included in submission

      // Pricing
      purchase_price: formData.basePrice,
      selling_price: formData.sellingPrice,
      amount_paid: formData.amountPaid || 0,

      // Stay details
      check_in_date: formData.checkInDate,
      check_out_date: formData.checkOutDate,
      check_in_time: formData.checkInTime || "14:00",
      check_out_time: formData.checkOutTime || "12:00",

      // Guest info
      number_of_guests: numberOfGuests,
      title: formData.title || "",
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      additionalGuests: JSON.stringify(additionalGuests),

      // Agency details
      travel_agency_name: formData.travel_agency_name || user?.travel_agency || "",
      travel_agency_address: formData.travel_agency_address || user?.business_address || "",
      travel_agency_number: formData.travel_agency_number || user?.contact_number || "",
      social_media_page: formData.social_media_page || user?.social_media_page || "",

      // System fields
      type_of_travel: "hotel",
      status: "Pending",
      special_requests: formData.specialRequests || "",
    }

    // Update form data with normalized values
    setFormData(submissionData)

    // Open booking details dialog
    setIsBookingDetailsDialogOpen(true)
  }

  const handleConfirmBookingDetails = () => {
    // Close booking details dialog and open payment dialog
    setIsBookingDetailsDialogOpen(false)
    setIsPaymentDialogOpen(true)
  }

  const handleBookingSuccess = () => {
    // Reset form after successful booking but preserve agency details
    setFormData({
      hotelName: "",
      location: "",
      hotelAddress: "",
      bookingId: "",
      checkInDate: "",
      checkOutDate: "",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      roomType: "",
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      email_merchant: user?.email || "",
      contact_number_merchant: user?.contact_number || "",
      basePrice: "",
      sellingPrice: "",
      // Preserve agency details and user ID
      uid: user?.id,
      travel_agency_name: user?.travel_agency || "",
      travel_agency_address: user?.business_address || "",
      travel_agency_number: user?.contact_number || "",
      social_media_page: user?.social_media_page || "",
    })

    setAdditionalGuests([])
    setCurrentStep(1)

    toast({
      title: "Booking Successful",
      description: "Your hotel booking has been processed successfully.",
      variant: "default",
    })
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else if (!validateStep(currentStep)) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <>
      <form className="space-y-6 overflow-x-hidden" onSubmit={handleSubmit}>
        {/* Header with Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-[#1A5EA2]">
              {currentStep === 1 && "Hotel Details"}
              {currentStep === 2 && "Stay Details"}
              {currentStep === 3 && "Guest Information"}
              {currentStep === 4 && "Contact & Pricing"}
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-sm text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">
                    Step {currentStep} of {totalSteps}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Complete all steps to submit your hotel booking</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button className="bg-[#3D89D6]" type="button" onClick={handleHotelBookingHistoryOpen}>
            <IconHistory className="w-4 h-4 mr-2" />
            Booking History
          </Button>
        </div>

        {/* Multi-step Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Hotel Details */}
            {currentStep === 1 && (
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 border-[#95C3E3] border-2 rounded-lg p-2">
                    <div className="space-y-1">
                      <Label htmlFor="hotelName">Hotel Name<span className="text-red-500">*</span></Label>
                      <Input
                        id="hotelName"
                        placeholder="Enter Hotel name"
                        value={formData.hotelName}
                        onChange={handleInputChange}
                        required
                        className={formErrors.hotelName ? "border-red-500" : ""}
                      />
                      {formErrors.hotelName && (
                        <p className="text-xs text-red-500">{formErrors.hotelName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="bookingId">Hotel Confirmation Number<span className="text-red-500">*</span></Label>
                      <Input
                        id="bookingId"
                        placeholder="Booking ID"
                        value={formData.bookingId || ""}
                        onChange={handleInputChange}
                        required
                        className={formErrors.bookingId ? "border-red-500" : ""}
                      />
                      {formErrors.bookingId ? (
                        <p className="text-xs text-red-500">{formErrors.bookingId}</p>
                      ) : (
                        <p className="text-xs text-gray-500">(Enter the confirmation number provided by the hotel)</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hotelAddress">Hotel Address<span className="text-red-500">*</span></Label>
                      <Input
                        id="hotelAddress"
                        placeholder="Enter Hotel address"
                        value={formData.hotelAddress || ""}
                        onChange={handleInputChange}
                        required
                        className={formErrors.hotelAddress ? "border-red-500" : ""}
                      />
                      {formErrors.hotelAddress && (
                        <p className="text-xs text-red-500">{formErrors.hotelAddress}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactNumber">Hotel Contact</Label>
                      <Input
                        id="contactNumber"
                        placeholder="Enter contact number"
                        value={formData.contactNumber || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="space-y-2">
                        <Label htmlFor="provider" className="font-medium">
                          Provider
                        </Label>
                        <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, provider: value }))} required>
                          <SelectTrigger id="provider" className="bg-white">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent id="provider">
                            <SelectItem value="12go">12go</SelectItem>
                            <SelectItem value="2GoTravel">2GoTravel</SelectItem>
                            <SelectItem value="Agoda">Agoda</SelectItem>
                            <SelectItem value="Air Asia">Air Asia</SelectItem>
                            <SelectItem value="Airpaz">Airpaz</SelectItem>
                            <SelectItem value="Cebu Pacific">Cebu Pacific</SelectItem>
                            <SelectItem value="Kiwi">Kiwi</SelectItem>
                            <SelectItem value="ly.com">ly.com</SelectItem>
                            <SelectItem value="PAL">PAL</SelectItem>
                            <SelectItem value="Traveloka">Traveloka</SelectItem>
                            <SelectItem value="Trip">Trip</SelectItem>
                            <SelectItem value="Others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Stay Details */}
            {currentStep === 2 && (
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 border-[#95C3E3] border-2 rounded-lg p-2">
                    <div className="space-y-1">
                      <Label htmlFor="checkInDate">Check-in Date<span className="text-red-500">*</span></Label>
                      <Input
                        id="checkInDate"
                        type="date"
                        value={formData.checkInDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="checkOutDate">Check-out Date<span className="text-red-500">*</span></Label>
                      <Input
                        id="checkOutDate"
                        type="date"
                        value={formData.checkOutDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="checkInTime">Check-in Time</Label>
                      <Input
                        id="checkInTime"
                        type="time"
                        value={formData.checkInTime || "14:00"}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-gray-500">Default: 2:00 PM</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="checkOutTime">Check-out Time</Label>
                      <Input
                        id="checkOutTime"
                        type="time"
                        value={formData.checkOutTime || "12:00"}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-gray-500">Default: 12:00 PM</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="roomType">Room Type<span className="text-red-500">*</span></Label>
                      <Select
                        onValueChange={(value) => setFormData((prev: HotelFormData) => ({ ...prev, roomType: value }))}
                        value={formData.roomType}
                        required
                      >
                        <SelectTrigger id="roomType">
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="twin">Twin</SelectItem>
                          <SelectItem value="superior">Superior</SelectItem>
                          <SelectItem value="suite">Suite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Input
                        id="specialRequests"
                        placeholder="Enter any special requests or requirements"
                        value={formData.specialRequests || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Guest Information */}
            {currentStep === 3 && (
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  {/* Primary Guest Details */}
                  <div className="space-y-2">
                    <h3 className="text-md font-semibold">Primary Guest Details</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 border-[#95C3E3] border-2 rounded-lg p-2">
                      <div className="space-y-1">
                        <Label htmlFor="title">Title<span className="text-red-500">*</span></Label>
                        <Select
                          onValueChange={(value) => setFormData((prev: HotelFormData) => ({ ...prev, title: value }))}
                          value={formData.title}
                          required
                        >
                          <SelectTrigger id="title">
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mr">Mr</SelectItem>
                            <SelectItem value="ms">Ms</SelectItem>
                            <SelectItem value="mrs">Mrs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="firstName">First Name<span className="text-red-500">*</span></Label>
                        <Input
                          id="firstName"
                          placeholder="Enter first name"
                          value={formData.firstName || ""}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lastName">Last Name<span className="text-red-500">*</span></Label>
                        <Input
                          id="lastName"
                          placeholder="Enter last name"
                          value={formData.lastName || ""}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Guests */}
                  {additionalGuests.map((guest, index) => (
                    <div key={index} className="space-y-2 mt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-md font-semibold">Additional Guest {index + 1}</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeGuest(index)}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 border-[#95C3E3] border-2 rounded-lg p-2">
                        <div className="space-y-1">
                          <Label>Title</Label>
                          <Select
                            onValueChange={(value) => handleAdditionalGuestChange(index, "title", value)}
                            value={guest.title}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mr">Mr</SelectItem>
                              <SelectItem value="ms">Ms</SelectItem>
                              <SelectItem value="mrs">Mrs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>First Name</Label>
                          <Input
                            placeholder="Enter first name"
                            value={guest.firstName}
                            onChange={(e) => handleAdditionalGuestChange(index, "firstName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Last Name</Label>
                          <Input
                            placeholder="Enter last name"
                            value={guest.lastName}
                            onChange={(e) => handleAdditionalGuestChange(index, "lastName", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end mt-4">
                    <Button type="button" variant="outline" onClick={addGuest} className="flex items-center gap-1">
                      <IconPlus size={16} /> Add Guest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Contact & Pricing Details */}
            {currentStep === 4 && (
              <Card className="border-[#95C3E3] shadow-sm">
                <CardContent className="p-6">
                  {/* Contact Details */}
                  <div className="space-y-2 mb-4">
                    <h3 className="text-md font-semibold">Primary Guest Contact Details</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 border-[#95C3E3] border-2 rounded-lg p-2">
                      <div className="space-y-1">
                        <Label htmlFor="email">Email Address<span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email || ""}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phoneNumber">Mobile Number<span className="text-red-500">*</span></Label>
                        <Input
                          id="phoneNumber"
                          placeholder="Enter mobile number"
                          value={formData.phoneNumber || ""}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your booking confirmation will be sent to this email address and mobile number.
                    </p>
                  </div>

                  {/* Merchant's/Distributor's Contact Details */}
                  <div className="space-y-2 mt-4">
                    <h4 className="text-md font-semibold mb-3 text-[#1A5EA2]">
                      Merchant's/Distributor's Contact Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-[#95C3E3] border-2 rounded-lg p-4 hidden">
                      <div className="space-y-2">
                        <Label htmlFor="email_merchant" className="font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email_merchant"
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email_merchant || ""}
                          onChange={handleInputChange}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="contact_number_merchant"
                          className="font-medium"
                        >
                          Mobile Number
                        </Label>
                        <Input
                          id="contact_number_merchant"
                          type="tel"
                          placeholder="Enter mobile number"
                          value={formData.contact_number_merchant || ""}
                          onChange={handleInputChange}
                          className="bg-white"
                          required
                        />
                      </div>
                    </div>

                    {user?.travel_agency && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <h5 className="text-sm font-medium text-blue-700 mb-2">
                          Agency Information
                        </h5>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                          <div>
                            <span className="font-medium">Agency Name:</span>{" "}
                            {user.travel_agency}
                          </div>
                          {user.business_address && (
                            <div>
                              <span className="font-medium">Address:</span>{" "}
                              {user.business_address}
                            </div>
                          )}
                          {user.social_media_page && (
                            <div>
                              <span className="font-medium">Social Media:</span>{" "}
                              {user.social_media_page}
                            </div>
                          )}
                          {user.email && (
                            <div>
                              <span className="font-medium">Email:</span>{" "}
                              {user.email}
                            </div>
                          )}
                          {user.contact_number && (
                            <div>
                              <span className="font-medium">Contact Number:</span>{" "}
                              {user.contact_number}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Details */}
                  <div className="space-y-2 mt-4">
                    <h3 className="text-md font-semibold">Pricing Details</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 border-[#95C3E3] border-2 rounded-lg p-2">
                      <div className="space-y-1">
                        <Label htmlFor="basePrice">Purchase Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                          <Input
                            id="basePrice"
                            type="number"
                            placeholder="Enter Purchase Price"
                            value={formData.basePrice || ""}
                            onChange={handleInputChange}
                            className="pl-7"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">Purchase price from provider</p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sellingPrice">Selling Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                          <Input
                            id="sellingPrice"
                            type="number"
                            placeholder="Enter selling price"
                            value={formData.sellingPrice || ""}
                            onChange={handleInputChange}
                            className="pl-7"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">Price charged to customer</p>
                      </div>


                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-[#3D89D6] text-[#3D89D6] hover:bg-[#3D89D6] hover:text-white transition-colors"
          >
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-[#3D89D6] hover:bg-[#1A5EA2] transition-colors px-6"
            >
              Generate Itinerary
            </Button>
          )}
        </div>
      </form>

      {/* Booking Details Dialog */}
      <HotelBookingDetails
        open={isBookingDetailsDialogOpen}
        onClose={() => setIsBookingDetailsDialogOpen(false)}
        bookingDetails={{
          ...formData,
          // Only pass additional guests, not primary guest
          additionalGuests: JSON.stringify(additionalGuests)
        }}
        onConfirm={handleConfirmBookingDetails}
      />

      {/* Payment Dialog */}
      <HotelPaymentDialog
        open={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        bookingDetails={{
          ...formData,
          // Only pass additional guests, not primary guest
          additionalGuests: JSON.stringify(additionalGuests)
        }}
        onBookingSuccess={handleBookingSuccess}
        userCredit={userCredit}
      />

      <Dialog
        open={isHotelBookingHistoryOpen}
        onOpenChange={(open) => {
          setIsHotelBookingHistoryOpen(open);
        }}
      >
        <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A5EA2] flex items-center gap-2">
              <IconHistory className="w-5 h-5" />
              Hotel Booking History
            </DialogTitle>
            <DialogDescription>
              View and manage all your hotel bookings
            </DialogDescription>
          </DialogHeader>
          <HotelBookingHistory onClose={handleHotelBookingHistoryClose} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Booking