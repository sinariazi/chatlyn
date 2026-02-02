"use server"

import { generateText } from "ai"
import prisma from "@/lib/db"
import { trackAISuggestionUsed } from "@/lib/analytics/trackEvent"

const TIMEOUT_MS = 30000

interface GenerateReplyResult {
  success: boolean
  suggestion?: string
  error?: string
}

export async function generateReplySuggestion(
  conversationId: string
): Promise<GenerateReplyResult> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 10,
        },
      },
    })

    if (!conversation) {
      return { success: false, error: "Conversation not found" }
    }

    if (conversation.messages.length === 0) {
      return { success: false, error: "No messages in conversation" }
    }

    const conversationHistory = conversation.messages
      .map((msg) => {
        const role = msg.direction === "INCOMING" ? "Guest" : "Staff"
        return `${role}: ${msg.content}`
      })
      .join("\n")

    const systemPrompt = `You are a professional hospitality assistant helping staff respond to guest inquiries. 
Your tone should be:
- Warm and welcoming
- Professional yet friendly
- Helpful and solution-oriented
- Empathetic to guest concerns

Generate a single, natural reply that a hotel or hospitality staff member would send.
Do not include any prefixes like "Staff:" or quotation marks.
Keep responses concise but complete (2-4 sentences typically).
If the guest has a complaint, acknowledge their concern and offer assistance.
If it's a general inquiry, provide helpful information.`

    const userPrompt = `Here is the conversation history on the ${conversation.channel.toLowerCase()} channel:

${conversationHistory}

Generate an appropriate reply to the most recent message from the guest.`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 300,
        abortSignal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!text || text.trim().length === 0) {
        return { success: false, error: "AI returned empty response" }
      }

      const suggestion = text.trim()

      // Track AI suggestion generated
      await trackAISuggestionUsed(conversationId, suggestion, "manual")

      return { success: true, suggestion }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "Request timed out. Please try again." }
      }
      throw error
    }
  } catch (error) {
    console.error("Error generating reply suggestion:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return { success: false, error: "AI service not configured" }
      }
      if (error.message.includes("rate limit")) {
        return { success: false, error: "Too many requests. Please wait a moment." }
      }
      return { success: false, error: error.message }
    }
    
    return { success: false, error: "Failed to generate suggestion" }
  }
}
