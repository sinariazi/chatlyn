"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface MessageVolumeChartProps {
  data: Array<{ date: string; received: number; sent: number }>
}

export function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  const hasData = data.some((d) => d.received > 0 || d.sent > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Volume</CardTitle>
        <CardDescription>Messages received and sent over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer
            config={{
              received: {
                label: "Received",
                color: "#3b82f6",
              },
              sent: {
                label: "Sent",
                color: "#10b981",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="received" 
                  fill="var(--color-received)" 
                  radius={[4, 4, 0, 0]} 
                  name="Received"
                />
                <Bar 
                  dataKey="sent" 
                  fill="var(--color-sent)" 
                  radius={[4, 4, 0, 0]} 
                  name="Sent"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No message data available yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}
