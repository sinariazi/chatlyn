"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

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
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  await prisma.event.create({
    data: {
      type: "MESSAGE_SENT",
      conversationId,
      payload: {
        messageId: message.id,
        channel: conversation.channel,
      },
    },
  })

  revalidatePath("/inbox", "page")

  return { success: true, message }
}
