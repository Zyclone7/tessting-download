'use client'

import { useState } from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconDoorExit, IconHours24, IconUsersGroup } from "@tabler/icons-react"
import GsatTable from "@/components/table/gsat-table/gsat-table"

const GsatMain = () => {
  const [, setViewVoucher] = useState<any>([])

  return (
    <div className="max-w-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Voucher</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>GSAT Vouchers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="px-4">
        </div>
      </header>

      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-full max-w-9xl px-4 pt-6">
          <p className="text-3xl font-bold">GSAT Vouchers</p>
          <p className="text-muted-foreground mt-2">
            Configure and manage GSAT voucher details and communication settings.
          </p>
          <Separator className="my-6" />
        </div>

        <div className="w-full max-w-9xl px-4">
          <p className="text-2xl font-bold">GSAT Voucher Tracking</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 mt-4 gap-4">
            
          </div>
        </div>

        <div className="w-full px-4">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-full lg:col-span-10 xl:col-span-12 overflow-auto">
              <GsatTable setViewVoucher={setViewVoucher} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GsatMain