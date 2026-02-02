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

interface RulePerformanceChartProps {
  data: Array<{ ruleName: string; triggered: number; executed: number }>
}

export function RulePerformanceChart({ data }: RulePerformanceChartProps) {
  const hasData = data.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Performance</CardTitle>
        <CardDescription>How often rules are triggered and executed</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer
            config={{
              triggered: {
                label: "Triggered",
                color: "#8b5cf6",
              },
              executed: {
                label: "Executed",
                color: "#06b6d4",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis 
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  type="category"
                  dataKey="ruleName"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="triggered" 
                  fill="var(--color-triggered)" 
                  radius={[0, 4, 4, 0]} 
                  name="Triggered"
                />
                <Bar 
                  dataKey="executed" 
                  fill="var(--color-executed)" 
                  radius={[0, 4, 4, 0]} 
                  name="Executed"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No rule activity yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}
