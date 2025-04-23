import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Store, User, Users } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface User {
  id: string;
  user_role: 'distributor' | 'merchant';
  user_credits: number;
  created_at?: string;
}

interface StatisticsPanelProps {
  users: any[];
}

export function StatisticsPanel({ users }: StatisticsPanelProps) {
  const totalUsers = users.length;
  const totalDistributors = users.filter(user => user.user_role === 'distributor').length;
  const totalMerchants = users.filter(user => user.user_role === 'merchant').length;
  const averageCredits = users.reduce((sum, user) => sum + user.user_credits, 0) / totalUsers;

  const userGrowthData = getUserGrowthData(users);
  const userRoleData = [
    { name: 'Distributors', value: totalDistributors },
    { name: 'Merchants', value: totalMerchants },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={User} />
        <StatCard title="Distributors" value={totalDistributors} icon={Users} />
        <StatCard title="Merchants" value={totalMerchants} icon={Store} />
        <StatCard title="Average Credits" value={`₱ ${averageCredits.toFixed(2)}`} icon={CreditCard} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              users: { label: "Users", color: "hsl(var(--chart-1))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              value: { label: "Users", color: "hsl(var(--chart-2))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRoleData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function getUserGrowthData(users: User[]) {
  const usersWithCreatedAt = users.filter(user => user.created_at != null);
  
  const sortedUsers = usersWithCreatedAt.sort((a, b) => {
    const dateA = new Date(a.created_at!.replace(' ', 'T'));
    const dateB = new Date(b.created_at!.replace(' ', 'T'));
    return dateA.getTime() - dateB.getTime();
  });

  const userGrowth = sortedUsers.reduce((acc, user, index) => {
    const date = new Date(user.created_at!.replace(' ', 'T'));
    if (!isNaN(date.getTime())) {
      const dateString = date.toISOString().split('T')[0];
      if (!acc[dateString]) {
        acc[dateString] = index + 1;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(userGrowth).map(([date, users]) => ({ date, users }));
}

