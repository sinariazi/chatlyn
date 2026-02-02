"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { evaluateRulesForMessage } from "@/lib/rules-engine/evaluateRules"
import { trackMessageSent, trackMessageReceived } from "@/lib/analytics/trackEvent"

interface SendMessageInput {
  conversationId: string
  content: string
}

export async function sendMessage({ conversationId, content }: SendMessageInput) {
  if (!content.trim()) {
    return { success: false, error: "Message content cannot be empty" }
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { channel: true },
  })

  if (!conversation) {
    return { success: false, error: "Conversation not found" }
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      channel: conversation.channel,
      direction: "OUTGOING",
      content: content.trim(),
      contentType: "TEXT",
      metadata: null,
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  // Track message sent event
  await trackMessageSent(conversationId, message.id, conversation.channel)

  revalidatePath("/inbox", "page")

  return { success: true, message }
}

interface ReceiveMessageInput {
  conversationId: string
  content: string
}

export async function receiveMessage({ conversationId, content }: ReceiveMessageInput) {
  if (!content.trim()) {
    return { success: false, error: "Message content cannot be empty" }
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { channel: true },
  })

  if (!conversation) {
    return { success: false, error: "Conversation not found" }
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      channel: conversation.channel,
      direction: "INCOMING",
      content: content.trim(),
      contentType: "TEXT",
      metadata: null,
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  // Track message received event
  await trackMessageReceived(conversationId, message.id, conversation.channel)

  // Evaluate rules for incoming message
  const ruleResults = await evaluateRulesForMessage(message.id)

  revalidatePath("/inbox", "page")

  // Check if any rule generated an auto-reply
  const autoReply = ruleResults.find((r) => r.matched && r.generatedReply)

  return { 
    success: true, 
    message,
    ruleResults,
    autoReply: autoReply?.generatedReply,
  }
}
