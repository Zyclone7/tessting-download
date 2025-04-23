import type React from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CreditCard, Users } from "lucide-react"
import type { ReferralIncomeTransaction, User } from "@/types/types"

const formatUserRole = (role: string) => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace("Package", "")
}

interface DetailProps {
  title: string
  value: string | number
  isCurrency?: boolean
}

const Detail: React.FC<DetailProps> = ({ title, value, isCurrency = false }) => (
  <div className="flex justify-between items-center py-1">
    <Label className="text-sm font-medium text-gray-500">{title}</Label>
    <span className="text-sm font-semibold">
      {isCurrency
        ? new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(Number(value))
        : value}
    </span>
  </div>
)

interface UserCardProps {
  title: string
  user: User | null
}

const UserCard: React.FC<UserCardProps> = ({ title, user }) => {
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Users className="mr-2 h-5 w-5" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">User not found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <Users className="mr-2 h-5 w-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Detail title="Name" value={user.user_nicename} />
          <Detail title="Email" value={user.user_email} />
          <Detail title="Role" value={formatUserRole(user.user_role)} />
          <Detail title="Level" value={user.user_level} />
          <Detail title="Credits" value={user.user_credits} isCurrency />
          <Detail title="Referral Code" value={user.user_referral_code} />
        </div>
      </CardContent>
    </Card>
  )
}

interface TransactionDetailsProps {
  transaction: ReferralIncomeTransaction
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <CreditCard className="mr-2 h-5 w-5" /> Referral Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Detail title="Referral ID" value={transaction.id} />
            <Detail title="Income Amount" value={transaction.income_amount} isCurrency />
            <Detail title="Level" value={transaction.level || "N/A"} />
            <Detail
              title="Date"
              value={
                transaction.created_at && !isNaN(new Date(transaction.created_at).getTime())
                  ? format(new Date(transaction.created_at), "PPP")
                  : "Invalid date"
              }
            />
            {transaction.invitation_code && (
              <>
                <Detail title="Invitation Code" value={transaction.invitation_code.code} />
                <Detail title="Package" value={formatUserRole(transaction.invitation_code.package)} />
                <Detail title="Package Amount" value={transaction.invitation_code.amount} isCurrency />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserCard title="Sender" user={transaction.sender} />
        <UserCard title="Recipient" user={transaction.recipient} />
      </div>
    </div>
  )
}
