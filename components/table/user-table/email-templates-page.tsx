"use client"

import { EmailTemplateManager } from "./email-template-manager"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Settings, Users } from "lucide-react"

export default function EmailTemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
          <p className="text-muted-foreground">Create, manage, and send email templates to your users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Email Settings
          </Button>
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Users className="h-4 w-4 mr-2" />
            Sent Emails
          </TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-6">
          <EmailTemplateManager />
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Email History</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              This section will display a history of all emails sent to users, including delivery status and open rates.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
