"use server"

import { prisma } from "@/lib/db"
import type { EventType } from "@prisma/client"

export interface TrackEventPayload {
  messageId?: string
  channel?: string
  ruleId?: string
  ruleName?: string
  suggestion?: string
  actionsExecuted?: string[]
  source?: string
  [key: string]: unknown
}

interface TrackEventInput {
  type: EventType
  conversationId?: string
  ruleId?: string
  payload?: TrackEventPayload
}

export async function trackEvent({
  type,
  conversationId,
  ruleId,
  payload,
}: TrackEventInput) {
  try {
    const event = await prisma.event.create({
      data: {
        type,
        conversationId,
        ruleId,
        payload: payload as Record<string, unknown>,
      },
    })

    return { success: true, eventId: event.id }
  } catch (error) {
    console.error("Failed to track event:", error)
    return { success: false, error: "Failed to track event" }
  }
}

// Convenience functions for common events

export async function trackMessageReceived(
  conversationId: string,
  messageId: string,
  channel: string
) {
  return trackEvent({
    type: "MESSAGE_RECEIVED",
    conversationId,
    payload: { messageId, channel },
  })
}

export async function trackMessageSent(
  conversationId: string,
  messageId: string,
  channel: string
) {
  return trackEvent({
    type: "MESSAGE_SENT",
    conversationId,
    payload: { messageId, channel },
  })
}

export async function trackAISuggestionUsed(
  conversationId: string,
  suggestion: string,
  source: "manual" | "rule" = "manual"
) {
  return trackEvent({
    type: "AI_RESPONSE_GENERATED",
    conversationId,
    payload: { suggestion, source, usedAt: new Date().toISOString() },
  })
}

export async function trackRuleTriggered(
  conversationId: string,
  ruleId: string,
  ruleName: string,
  messageId: string
) {
  return trackEvent({
    type: "RULE_TRIGGERED",
    conversationId,
    ruleId,
    payload: { ruleName, messageId },
  })
}

export async function trackRuleExecuted(
  conversationId: string,
  ruleId: string,
  ruleName: string,
  actionsExecuted: string[]
) {
  return trackEvent({
    type: "RULE_EXECUTED",
    conversationId,
    ruleId,
    payload: { ruleName, actionsExecuted },
  })
}

export async function trackConversationStarted(
  conversationId: string,
  channel: string,
  contactId: string
) {
  return trackEvent({
    type: "CONVERSATION_STARTED",
    conversationId,
    payload: { channel, contactId },
  })
}

export async function trackConversationResolved(conversationId: string) {
  return trackEvent({
    type: "CONVERSATION_RESOLVED",
    conversationId,
    payload: { resolvedAt: new Date().toISOString() },
  })
}
