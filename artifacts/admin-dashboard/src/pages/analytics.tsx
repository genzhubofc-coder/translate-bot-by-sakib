import { useState } from "react";
import { useGetDailyStats, getGetDailyStatsQueryKey, useGetWeeklyStats, getGetWeeklyStatsQueryKey, useGetMonthlyStats, getGetMonthlyStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("daily");

  const { data: dailyStats, isLoading: isDailyLoading } = useGetDailyStats({
    query: { queryKey: getGetDailyStatsQueryKey(), enabled: timeRange === "daily" }
  });

  const { data: weeklyStats, isLoading: isWeeklyLoading } = useGetWeeklyStats({
    query: { queryKey: getGetWeeklyStatsQueryKey(), enabled: timeRange === "weekly" }
  });

  const { data: monthlyStats, isLoading: isMonthlyLoading } = useGetMonthlyStats({
    query: { queryKey: getGetMonthlyStatsQueryKey(), enabled: timeRange === "monthly" }
  });

  const isLoading = timeRange === "daily" ? isDailyLoading : timeRange === "weekly" ? isWeeklyLoading : isMonthlyLoading;
  
  let chartData: any[] = [];
  let xAxisKey = "date";
  let formatXAxis = (v: string) => v;
  let tooltipLabelFormat = (v: string) => v;

  if (timeRange === "daily" && dailyStats) {
    chartData = dailyStats;
    xAxisKey = "date";
    formatXAxis = (v: string) => format(new Date(v), 'MMM d');
    tooltipLabelFormat = (v: string) => format(new Date(v), 'MMM d, yyyy');
  } else if (timeRange === "weekly" && weeklyStats) {
    chartData = weeklyStats;
    xAxisKey = "week";
    formatXAxis = (v: string) => v.split('W')[1] ? `W${v.split('W')[1]}` : v;
    tooltipLabelFormat = (v: string) => `Week of ${v.split('-W')[0]}`;
  } else if (timeRange === "monthly" && monthlyStats) {
    chartData = monthlyStats;
    xAxisKey = "month";
    formatXAxis = (v: string) => {
      const d = new Date(`${v}-01`);
      return format(d, 'MMM yyyy');
    };
    tooltipLabelFormat = (v: string) => {
      const d = new Date(`${v}-01`);
      return format(d, 'MMMM yyyy');
    };
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-2">{tooltipLabelFormat(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-sm font-mono">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-bold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Historical data and usage trends.</p>
      </div>

      <Tabs value={timeRange} onValueChange={setTimeRange} className="space-y-4">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="daily" className="font-mono text-xs">DAILY (30D)</TabsTrigger>
          <TabsTrigger value="weekly" className="font-mono text-xs">WEEKLY (12W)</TabsTrigger>
          <TabsTrigger value="monthly" className="font-mono text-xs">MONTHLY (12M)</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-4 m-0">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Translation Volume</CardTitle>
              <CardDescription>Number of translations processed vs total messages received</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTranslations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={xAxisKey} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatXAxis}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                    <Area 
                      type="monotone" 
                      dataKey="messages" 
                      name="messages"
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMessages)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="translations" 
                      name="translations"
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

          <Card className="border-border">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Unique active users during the period</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={xAxisKey} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatXAxis}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                    <Bar 
                      dataKey="users" 
                      name="active users"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}