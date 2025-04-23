import { Suspense } from "react"
import { TermsManagementTable } from "./terms-management-table"
import { PolicyManagementTable } from "./policy-management-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function TermsManagementPage() {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Terms & Privacy Management</h1>
                <p className="text-muted-foreground">Manage your terms and conditions and privacy policy content.</p>
            </div>

            <Tabs defaultValue="terms" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                </TabsList>

                <TabsContent value="terms" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Terms & Conditions Management</CardTitle>
                            <CardDescription>Create, update, and manage your terms and conditions sections.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense
                                fallback={
                                    <div className="flex justify-center items-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2">Loading terms data...</span>
                                    </div>
                                }
                            >
                                <TermsManagementTable />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Policy Management</CardTitle>
                            <CardDescription>Create, update, and manage your privacy policy sections.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense
                                fallback={
                                    <div className="flex justify-center items-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="ml-2">Loading privacy policy data...</span>
                                    </div>
                                }
                            >
                                <PolicyManagementTable />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
