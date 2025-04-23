"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {KYCVerificationTable} from "@/components/table/kyc-table/page";


const kycVeficationPage = () => {
  return (
    <div className="max-w-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Report</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>KYC Verification</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-full max-w-9xl px-4 pt-6">
          <p className="text-3xl font-bold">KYC Verification List</p>
          <p className="text-muted-foreground mt-2">
            View and manage KYC Verification here.
          </p>
          <Separator className="my-6" />
        </div>
        <div className="w-full px-4">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-full lg:col-span-10 xl:col-span-12 overflow-auto">
              <KYCVerificationTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default kycVeficationPage;