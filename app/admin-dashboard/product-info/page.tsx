"use client"

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
import ProductsTable from "@/components/product-package-setting"

const ProductMain = () => {
  const [, setViewVoucher] = useState<any>([])

  return (
    <div className="max-w-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 transition-all ease-in-out group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1 text-gray-700 hover:text-gray-900" />
          <Separator orientation="vertical" className="mr-4 h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Franchise Packages</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="px-4 flex gap-4 items-center">
          {/* Optional additional header content like notifications or user profile */}
        </div>
      </header>

      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-full max-w-9xl px-6 pt-8">
          <p className="text-4xl font-bold text-gray-900">Franchise Packages</p>
          <p className="text-muted-foreground mt-2 text-lg">
            Configure and manage packages and products details and settings.
          </p>
          <Separator className="my-6" />
        </div>

        <div className="w-full px-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-full lg:col-span-10 xl:col-span-12 overflow-auto">
              <ProductsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductMain