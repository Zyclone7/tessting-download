"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useUserContext } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Logo from "@/public/images/pt-logo.png"
import Background from "@/public/images/logo-sample3.jpg"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const SignIn = () => {
  const router = useRouter()
  const { user, setUser, setToken } = useUserContext()
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [data, setData] = useState({
    email: "",
    password: "",
    otp: "",
  })
  const [loading, setLoading] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin-dashboard")
      } else if (user.role === "verifier") {
        router.push("/admin-dashboard/atm-transaction")
      } else if (user.role === "uploader") {
        router.push("/admin-dashboard/atm-transaction")
      } else if (user.role === "approver") {
        router.push("/admin-dashboard/atm-transaction")
      } else if (user.role === "kyc_approver") {
        router.push("/admin-dashboard/kyc")
      } else if (user.role === "voucher_uploader") {
        router.push("/admin-dashboard/vouchers")
      } else if (user.role === "travel_approver") {
        router.push("/admin-dashboard/travels")
      } else if (user.role === "merchant" || user.role === "distributor") {
        router.push(`/user-dashboard`)
      }
    }
  }, [user, router])

  // Focus OTP input when step changes
  useEffect(() => {
    if (showOtpStep && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [showOtpStep])

  // Auto-verify OTP when 6 digits are entered
  useEffect(() => {
    if (data.otp.length === 6 && !verifyingOtp) {
      handleVerifyOtp()
    }
  }, [data.otp])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post("/api/auth/login", {
        email: data.email,
        password: data.password,
      })

      // Check if user is admin/verifier/uploader and bypass OTP
      if (
        response.data.user &&
        ["admin", "verifier", "uploader", "approver", "kyc_approver", "voucher_uploader", "travel_approver"].includes(
          response.data.user.role,
        )
      ) {
        setUser(response.data.user)
        setToken(response.data.token)
        handleUserRedirect(response.data.user)
        toast({
          title: "Success",
          description: "Login successful",
        })
      } else if (response.data.otpRequired) {
        setPendingEmail(data.email)
        setShowOtpStep(true)
        toast({
          title: "OTP Sent",
          description: "Check your email for the verification code",
        })
      }
    } catch (error) {
      handleAuthError(error, "Login Failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (data.otp.length !== 6 || verifyingOtp) return

    setVerifyingOtp(true)
    setLoading(true)

    try {
      const response = await axios.post("/api/auth/verify-otp", {
        email: pendingEmail,
        otp: data.otp,
      })

      const { user: userData, token } = response.data
      setUser(userData)
      setToken(token)

      // Handle redirect based on verified role
      handleUserRedirect(userData)
      toast({
        title: "Success",
        description: "Login successful",
      })
    } catch (error) {
      handleAuthError(error, "OTP Verification Failed")
      // Reset OTP on failure
      setData((prev) => ({ ...prev, otp: "" }))
      if (otpInputRef.current) {
        otpInputRef.current.focus()
      }
    } finally {
      setLoading(false)
      setVerifyingOtp(false)
    }
  }

  const resendOtp = async () => {
    try {
      await axios.post("/api/auth/resend-otp", { email: pendingEmail })
      toast({
        title: "OTP Resent",
        description: "A new code has been sent to your email",
      })
    } catch (error) {
      handleAuthError(error, "Resend Failed")
    }
  }

  const handleUserRedirect = (userData: any) => {
    if (userData.role === "admin") {
      router.push("/admin-dashboard")
    } else if (
      [
        "merchant",
        "distributor",
        "Basic_Merchant_Package",
        "Premium_Merchant_Package",
        "Elite_Distributor_Package",
        "Elite_Plus_Distributor_Package",
        "retailer",
      ].includes(userData.role)
    ) {
      router.push(`/user-dashboard`)
    } else if (
      ["uploader", "checker", "verifier", "approver", "kyc_approver", "voucher_uploader", "travel_approver"].includes(
        userData.role,
      )
    ) {
      router.push("/admin-dashboard")
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this system",
        variant: "destructive",
      })
    }
  }

  const handleAuthError = (error: any, title: string) => {
    if (axios.isAxiosError(error)) {
      toast({
        title,
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      })
    } else {
      toast({
        title,
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleOtpChange = (newValue: string) => {
    if (/^\d*$/.test(newValue) && newValue.length <= 6) {
      setData({ ...data, otp: newValue });
    }
  };

  return (
    <div className="flex h-screen overflow-x-hidden">
      {/* Left Section - Hero Image */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <Image
          src={Background || "/placeholder.svg"}
          alt="Travel Scene"
          layout="fill"
          className="object-cover w-full h-full object-center"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50">
          <div className="flex flex-col justify-between h-full text-white">
            <div></div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6 px-8 py-12 backdrop-blur-sm bg-black bg-opacity-30 rounded-lg m-8"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg font-semibold"
              >
                Unlock Your Business Potential with Our Proven Strategies
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-5xl font-extrabold"
                style={{
                  fontFamily: "Poppins, Sans-serif",
                  textTransform: "uppercase",
                  color: "#49C0FB",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                PHILTECH Business Group
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="text-sm leading-relaxed"
              >
                At PHILTECH Business Group, we believe in unlocking the full potential of your business through
                innovative and proven strategies. Our comprehensive suite of services—ranging from digital solutions to
                ATM withdrawals, Wi-Fi zones, travel bookings, and entertainment offerings—are designed to meet the
                demands of today's competitive market. By partnering with us, you gain access to time-tested strategies
                that drive growth, increase customer satisfaction, and improve profitability.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Section - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 relative"
      >
        <div className="absolute inset-0 lg:hidden">
          <Image
            src={Background || "/placeholder.svg"}
            alt="Background"
            layout="fill"
            className="object-cover w-full h-full object-center"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              }}
            >
              <Link href="https://www.philtechbusiness.ph">
                <Image
                  src={Logo || "/placeholder.svg"}
                  alt="Logo"
                  className="rounded-full mx-auto"
                  width={150}
                  height={150}
                />
              </Link>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 text-3xl font-bold tracking-tight text-white lg:text-gray-900"
            >
              {showOtpStep ? "Verify Identity" : "Welcome back"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-2 text-sm text-gray-200 lg:text-gray-600"
            >
              {showOtpStep ? "Enter the 6-digit code sent to your email" : "Please sign in to continue"}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={showOtpStep ? "otp" : "login"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 space-y-6 lg:bg-transparent lg:p-0 bg-white bg-opacity-90 p-8 rounded-lg"
            >
              {!showOtpStep ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <motion.div className="relative">
                    <Label htmlFor="email" className="sr-only">
                      Email
                    </Label>
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      type="email"
                      id="email"
                      placeholder="Email address"
                      required
                      className="pl-10"
                    />
                  </motion.div>

                  <motion.div className="relative">
                    <Label htmlFor="password" className="sr-only">
                      Password
                    </Label>
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      value={data.password}
                      onChange={(e) => setData({ ...data, password: e.target.value })}
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Password"
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </motion.div>

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </div>

                  <Button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="animate-spin" size={20} />
                        Signing In...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 text-gray-500 bg-white">Or continue with</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                      Sign up
                    </Link>
                  </p>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center mb-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-0 mr-2"
                        onClick={() => {
                          setShowOtpStep(false)
                          setData((prev) => ({ ...prev, otp: "" }))
                        }}
                      >
                        <ArrowLeft size={18} />
                      </Button>
                      <p className="text-sm text-gray-600">
                        A verification code has been sent to <span className="font-medium">{pendingEmail}</span>
                      </p>
                    </div>

                    <div className="flex flex-col justify-center items-center">
                      <Label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                        Enter 6-digit verification code
                      </Label>
                      <InputOTP
                        id="otp"
                        value={data.otp}
                        onChange={handleOtpChange}
                        maxLength={6}
                        autoComplete="one-time-code"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} autoFocus={showOtpStep} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>

                      {/* Visual indicator for OTP progress */}
                      <div className="mt-3 flex gap-1 justify-center">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${i < data.otp.length ? "bg-blue-600" : "bg-gray-200"
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    {loading && (
                      <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
                        <Loader className="animate-spin" size={20} />
                        <span>Verifying...</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center mt-4">
                      <Button
                        type="button"
                        variant="link"
                        onClick={resendOtp}
                        className="text-sm text-blue-600 hover:text-blue-500"
                        disabled={loading}
                      >
                        Didn't receive a code? Resend
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default SignIn
