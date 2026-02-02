"use server"

import { generateText } from "ai"
import prisma, { type Message } from "@/lib/db"
import { trackAISuggestionUsed } from "@/lib/analytics/trackEvent"

const TIMEOUT_MS = 30000

type ConversationWithMessages = {
  id: string
  contactId: string
  channel: string
  messages: Message[]
}

interface GenerateReplyResult {
  success: boolean
  suggestion?: string
  error?: string
  isMock?: boolean
}

// Mock suggestions for demo purposes when API key is not configured
const MOCK_SUGGESTIONS = [
  "Thank you for reaching out! I'd be happy to help you with that. Could you please provide me with a bit more information so I can assist you better?",
  "I appreciate you bringing this to our attention. Let me look into this right away and get back to you with a solution as soon as possible.",
  "Good morning! Thank you for your message. I'll be glad to arrange that for you. What time would work best?",
  "I understand your concern and I'm here to help. Let me check the details and ensure we address this properly for you.",
  "Thank you for your patience! I've reviewed your request and I'm pleased to confirm that we can accommodate your needs.",
  "I completely understand how you feel. We truly value your feedback and want to make this right for you.",
  "Great question! I'd be happy to provide you with that information. Here's what you need to know.",
  "Thank you for your inquiry! I've checked our availability and I have some excellent options for you to consider.",
]

function getMockSuggestion(conversationHistory: string): string {
  // Simple deterministic selection based on message content
  const keywords = conversationHistory.toLowerCase()
  
  if (keywords.includes("urgent") || keywords.includes("emergency") || keywords.includes("problem")) {
    return MOCK_SUGGESTIONS[1]
  }
  if (keywords.includes("booking") || keywords.includes("reservation") || keywords.includes("available")) {
    return MOCK_SUGGESTIONS[7]
  }
  if (keywords.includes("checkout") || keywords.includes("time") || keywords.includes("when")) {
    return MOCK_SUGGESTIONS[2]
  }
  if (keywords.includes("complaint") || keywords.includes("disappointed") || keywords.includes("unhappy")) {
    return MOCK_SUGGESTIONS[5]
  }
  if (keywords.includes("question") || keywords.includes("info") || keywords.includes("tell me")) {
    return MOCK_SUGGESTIONS[6]
  }
  if (keywords.includes("thank") || keywords.includes("confirm")) {
    return MOCK_SUGGESTIONS[4]
  }
  
  // Default to first generic response
  return MOCK_SUGGESTIONS[0]
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

    // Type guard to ensure messages exist
    if (!("messages" in conversation) || !Array.isArray(conversation.messages)) {
      return { success: false, error: "Could not load conversation messages" }
    }

    if (conversation.messages.length === 0) {
      return { success: false, error: "No messages in conversation" }
    }

    const conversationHistory = conversation.messages
      .map((msg: Message) => {
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
      // Check for authentication/API key errors - return mock suggestion instead
      if (error.message.includes("Unauthenticated") || 
          error.message.includes("API key") || 
          error.message.includes("AI_GATEWAY_API_KEY")) {
        
        // Get conversation for mock generation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 10,
            },
          },
        })

        if (conversation && "messages" in conversation && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
          const conversationHistory = conversation.messages
            .map((msg: Message) => `${msg.direction === "INCOMING" ? "Guest" : "Staff"}: ${msg.content}`)
            .join("\n")
          
          const mockSuggestion = getMockSuggestion(conversationHistory)
          
          // Track mock suggestion usage
          await trackAISuggestionUsed(conversationId, mockSuggestion, "manual")
          
          return { 
            success: true, 
            suggestion: mockSuggestion,
            isMock: true
          }
        }
        
        return { 
          success: false, 
          error: "AI suggestions require an OpenAI API key. Add OPENAI_API_KEY to your environment variables." 
        }
      }
      
      // Check for rate limit errors
      if (error.message.includes("rate limit")) {
        return { success: false, error: "Too many requests. Please wait a moment." }
      }
      
      // Generic error message for other errors
      return { success: false, error: `AI service error: ${error.message}` }
    }
    
    return { success: false, error: "Failed to generate suggestion" }
  }
}
