import prisma from "@/lib/db"
import type { ConversationWithMessages } from "./types"

export async function getConversationsWithMessages(): Promise<ConversationWithMessages[]> {
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  return conversations as ConversationWithMessages[]
}

export async function getConversationById(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  return conversation
}
