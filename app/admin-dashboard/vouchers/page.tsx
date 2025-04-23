'use client'

import { motion } from 'framer-motion'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Tv, Wifi, Satellite } from 'lucide-react'
import Link from 'next/link'

const voucherTypes = [
  { name: 'GSAT', icon: Satellite, href: '/admin-dashboard/vouchers/gsat' },
  { name: 'Television', icon: Tv, href: '/admin-dashboard/vouchers/tv' },
  { name: 'WiFi', icon: Wifi, href: '/admin-dashboard/vouchers/wifi' },

]

export default function VoucherPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20"
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Vouchers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Voucher Selection</h1>
          <p className="text-xl text-muted-foreground">
            Which voucher type would you like to manage?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {voucherTypes.map((voucher, index) => (
            <motion.div
              key={voucher.name}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <Link href={voucher.href}>
                <Card
                  className="group h-64 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <CardContent className="h-full flex flex-col items-center justify-center p-6">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-4xl mb-4 text-primary"
                    >
                      <voucher.icon size={64} />
                    </motion.div>
                    <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors duration-300">
                      {voucher.name}
                    </h2>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}