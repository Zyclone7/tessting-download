"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankDetailsForm } from "./bank-details-form"
import { UpdateHistory } from "./update-history"

interface UserBankDetailsProps {
    userData: any
    readOnly?: boolean
    isCurrentUser?: boolean
}

export function UserBankDetails({ userData, readOnly = false, isCurrentUser = true }: UserBankDetailsProps) {
    const [activeTab, setActiveTab] = useState("details")

    return (
        <div className="w-full">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="details">Bank Details</TabsTrigger>
                    <TabsTrigger value="history">Update History</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <BankDetailsForm userData={userData} readOnly={readOnly} isCurrentUser={isCurrentUser} />
                </TabsContent>

                <TabsContent value="history">
                    <UpdateHistory userId={userData.ID} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
