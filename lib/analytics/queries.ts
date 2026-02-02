"use server"

import { prisma } from "@/lib/db"

export interface AnalyticsData {
  totalMessages: number
  messagesReceived: number
  messagesSent: number
  aiAssistedReplies: number
  aiAssistedPercentage: number
  automatedReplies: number
  automatedPercentage: number
  averageResponseTimeMs: number
  averageResponseTimeFormatted: string
  messagesByDay: Array<{ date: string; received: number; sent: number }>
  messagesByChannel: Array<{ channel: string; count: number }>
  rulePerformance: Array<{ ruleName: string; triggered: number; executed: number }>
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  // Get all messages count
  const totalMessages = await prisma.message.count()
  
  // Get messages by direction
  const messagesReceived = await prisma.message.count({
    where: { direction: "INCOMING" },
  })
  
  const messagesSent = await prisma.message.count({
    where: { direction: "OUTGOING" },
  })

  // Get AI-assisted replies (AI_RESPONSE_GENERATED events with source: "manual")
  const aiAssistedEvents = await prisma.event.count({
    where: {
      type: "AI_RESPONSE_GENERATED",
      payload: {
        path: ["source"],
        equals: "manual",
      },
    },
  })

  // Get automated replies (AI_RESPONSE_GENERATED events with source: "rule")
  const automatedEvents = await prisma.event.count({
    where: {
      type: "AI_RESPONSE_GENERATED",
      payload: {
        path: ["source"],
        equals: "rule",
      },
    },
  })

  // Calculate percentages
  const aiAssistedPercentage = messagesSent > 0 
    ? Math.round((aiAssistedEvents / messagesSent) * 100) 
    : 0
  
  const automatedPercentage = messagesSent > 0 
    ? Math.round((automatedEvents / messagesSent) * 100) 
    : 0

  // Calculate average response time
  // Get conversations with at least one incoming and one outgoing message
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  let totalResponseTime = 0
  let responseCount = 0

  for (const conversation of conversations) {
    const messages = conversation.messages
    
    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i]
      const next = messages[i + 1]
      
      // If current is incoming and next is outgoing, calculate response time
      if (current.direction === "INCOMING" && next.direction === "OUTGOING") {
        const responseTime = next.createdAt.getTime() - current.createdAt.getTime()
        totalResponseTime += responseTime
        responseCount++
      }
    }
  }

  const averageResponseTimeMs = responseCount > 0 
    ? Math.round(totalResponseTime / responseCount) 
    : 0

  // Format response time
  const formatResponseTime = (ms: number): string => {
    if (ms === 0) return "N/A"
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`
    return `${Math.round(ms / 3600000)}h`
  }

  // Get messages by day (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentMessages = await prisma.message.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      direction: true,
      createdAt: true,
    },
  })

  const messagesByDayMap = new Map<string, { received: number; sent: number }>()
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    messagesByDayMap.set(dateStr, { received: 0, sent: 0 })
  }

  for (const message of recentMessages) {
    const dateStr = message.createdAt.toISOString().split("T")[0]
    const existing = messagesByDayMap.get(dateStr) || { received: 0, sent: 0 }
    
    if (message.direction === "INCOMING") {
      existing.received++
    } else {
      existing.sent++
    }
    
    messagesByDayMap.set(dateStr, existing)
  }

  const messagesByDay = Array.from(messagesByDayMap.entries()).map(([date, counts]) => ({
    date: new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    received: counts.received,
    sent: counts.sent,
  }))

  // Get messages by channel
  const channelCounts = await prisma.message.groupBy({
    by: ["channel"],
    _count: { id: true },
  })

  const messagesByChannel = channelCounts.map((c) => ({
    channel: c.channel,
    count: c._count.id,
  }))

  // Get rule performance
  const rules = await prisma.rule.findMany({
    select: { id: true, name: true },
  })

  const rulePerformance = await Promise.all(
    rules.map(async (rule) => {
      const triggered = await prisma.event.count({
        where: { type: "RULE_TRIGGERED", ruleId: rule.id },
      })
      const executed = await prisma.event.count({
        where: { type: "RULE_EXECUTED", ruleId: rule.id },
      })
      return {
        ruleName: rule.name,
        triggered,
        executed,
      }
    })
  )

  return {
    totalMessages,
    messagesReceived,
    messagesSent,
    aiAssistedReplies: aiAssistedEvents,
    aiAssistedPercentage,
    automatedReplies: automatedEvents,
    automatedPercentage,
    averageResponseTimeMs,
    averageResponseTimeFormatted: formatResponseTime(averageResponseTimeMs),
    messagesByDay,
    messagesByChannel,
    rulePerformance: rulePerformance.filter((r) => r.triggered > 0 || r.executed > 0),
  }
}
