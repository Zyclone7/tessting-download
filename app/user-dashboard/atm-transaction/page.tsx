"use client"
import AtmReportTable from "@/components/table/atm-transaction-table";
import { Separator } from "@/components/ui/separator";
import React, { useState } from "react";

const Page = () => {
    const [, setViewVoucher] = useState<any>([]);
  return (
    <div className="max-w-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
        </div>
      </header>

      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-full max-w-9xl px-4 pt-6">
          <p className="text-3xl font-bold">ATM Reporting</p>
          <p className="text-muted-foreground mt-2">
            Configure and manage ATM details and communication settings.
            settings.
          </p>
          <Separator className="my-6" />
        </div>
        <div className="w-full px-4">
          {/* New Wrapper Div with Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* ATM Report Table inside the Grid */}
            <div className="col-span-full lg:col-span-10 xl:col-span-12 overflow-auto">
              <AtmReportTable setViewVoucher={setViewVoucher} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
