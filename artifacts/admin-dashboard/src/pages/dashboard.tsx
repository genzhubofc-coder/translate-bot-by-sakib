import { useGetStatsOverview, getGetStatsOverviewQueryKey, useGetDailyStats, getGetDailyStatsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, MessageSquare, ArrowRightLeft, Activity, Ban, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: any, description?: string }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useGetStatsOverview({
    query: {
      queryKey: getGetStatsOverviewQueryKey()
    }
  });

  const { data: dailyStats, isLoading: isChartLoading } = useGetDailyStats({
    query: {
      queryKey: getGetDailyStatsQueryKey()
    }
  });

  const { data: recentActivity, isLoading: isActivityLoading } = useGetRecentActivity({
    query: {
      queryKey: getGetRecentActivityQueryKey()
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">System metrics and recent activity.</p>
      </div>

      {isStatsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-[100px]" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-[60px]" /></CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} />
          <StatCard title="Active Today" value={stats.activeTodayUsers.toLocaleString()} icon={Activity} />
          <StatCard title="Total Messages" value={stats.totalMessages.toLocaleString()} icon={MessageSquare} />
          <StatCard title="Total Translations" value={stats.totalTranslations.toLocaleString()} icon={ArrowRightLeft} />
          
          <StatCard title="BN to EN" value={stats.bnToEnCount.toLocaleString()} icon={ArrowRightLeft} description={`${Math.round((stats.bnToEnCount / (stats.totalTranslations || 1)) * 100)}% of total`} />
          <StatCard title="EN to BN" value={stats.enToBnCount.toLocaleString()} icon={ArrowRightLeft} description={`${Math.round((stats.enToBnCount / (stats.totalTranslations || 1)) * 100)}% of total`} />
          <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={Percent} />
          <StatCard title="Banned Users" value={stats.bannedUsers.toLocaleString()} icon={Ban} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 border-border">
          <CardHeader>
            <CardTitle>Daily Translations</CardTitle>
            <CardDescription>Volume of translations processed over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isChartLoading ? (
              <Skeleton className="w-full h-full" />
            ) : dailyStats ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTranslations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="translations" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTranslations)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and translations</CardDescription>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {activity.type === 'user_joined' ? (
                        <Users className="h-4 w-4 text-primary" />
                      ) : activity.type === 'translation' ? (
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                      ) : (
                        <Activity className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm">
                        {activity.username && <span className="font-semibold">{activity.username} </span>}
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}