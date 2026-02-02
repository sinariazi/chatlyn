"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts"
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

interface ChannelDistributionChartProps {
  data: Array<{ channel: string; count: number }>
}

const COLORS: Record<string, string> = {
  WEB: "#3b82f6",
  WHATSAPP: "#22c55e",
  EMAIL: "#f59e0b",
}

export function ChannelDistributionChart({ data }: ChannelDistributionChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.count > 0)

  const chartConfig = data.reduce(
    (acc, item) => ({
      ...acc,
      [item.channel]: {
        label: item.channel.charAt(0) + item.channel.slice(1).toLowerCase(),
        color: COLORS[item.channel] || "#6b7280",
      },
    }),
    {} as Record<string, { label: string; color: string }>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Distribution</CardTitle>
        <CardDescription>Messages by communication channel</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={2}
                  label={({ channel, percent }) =>
                    `${channel} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.channel}
                      fill={COLORS[entry.channel] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Legend 
                  formatter={(value) => (
                    <span className="text-sm text-foreground">
                      {String(value).charAt(0) + String(value).slice(1).toLowerCase()}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No channel data available yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}
