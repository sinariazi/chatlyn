import { prisma } from "@/lib/db"
import { evaluateRulesForMessage } from "@/lib/rules-engine/evaluateRules"
import { NextResponse } from "next/server"

type Channel = "WEB" | "WHATSAPP" | "EMAIL"

interface IncomingMessagePayload {
  // Required fields
  content: string
  channel: Channel
  contactId: string

  // Optional: use existing conversation
  conversationId?: string

  // Optional: metadata for new conversation
  subject?: string
  metadata?: Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingMessagePayload

    // Validate required fields
    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      )
    }

    if (!body.channel || !["WEB", "WHATSAPP", "EMAIL"].includes(body.channel)) {
      return NextResponse.json(
        { success: false, error: "Valid channel is required (WEB, WHATSAPP, EMAIL)" },
        { status: 400 }
      )
    }

    if (!body.contactId?.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact ID is required" },
        { status: 400 }
      )
    }

    let conversationId = body.conversationId

    // If no conversation ID provided, find existing or create new
    if (!conversationId) {
      // Try to find an open conversation with this contact on this channel
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          contactId: body.contactId,
          channel: body.channel,
          status: { in: ["OPEN", "PENDING"] },
        },
        orderBy: { updatedAt: "desc" },
      })

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        // Create a new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            contactId: body.contactId,
            channel: body.channel,
            status: "OPEN",
            subject: body.subject || `New ${body.channel.toLowerCase()} conversation`,
            metadata: body.metadata || {},
          },
        })

        conversationId = newConversation.id

        // Log conversation started event
        await prisma.event.create({
          data: {
            type: "CONVERSATION_STARTED",
            conversationId: newConversation.id,
            payload: {
              channel: body.channel,
              contactId: body.contactId,
              source: "api",
            },
          },
        })
      }
    } else {
      // Verify conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      })

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: "Conversation not found" },
          { status: 404 }
        )
      }
    }

    // Create the incoming message
    const message = await prisma.message.create({
      data: {
        conversationId,
        channel: body.channel,
        direction: "INCOMING",
        content: body.content.trim(),
        contentType: "TEXT",
        metadata: body.metadata || {},
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Log message received event
    await prisma.event.create({
      data: {
        type: "MESSAGE_RECEIVED",
        conversationId,
        payload: {
          messageId: message.id,
          channel: body.channel,
          source: "api",
          contactId: body.contactId,
        },
      },
    })

    // Evaluate rules for the incoming message
    const ruleResults = await evaluateRulesForMessage(message.id)

    // Check if any rule generated an auto-reply
    const matchedRules = ruleResults.filter((r) => r.matched)
    const autoReplies = matchedRules
      .filter((r) => r.generatedReply)
      .map((r) => ({
        ruleId: r.ruleId,
        ruleName: r.ruleName,
        reply: r.generatedReply,
      }))

    return NextResponse.json({
      success: true,
      data: {
        message: {
          id: message.id,
          conversationId: message.conversationId,
          channel: message.channel,
          direction: message.direction,
          content: message.content,
          createdAt: message.createdAt,
        },
        conversationId,
        rulesEvaluated: ruleResults.length,
        rulesMatched: matchedRules.length,
        autoReplies,
      },
    })
  } catch (error) {
    console.error("Error processing incoming message:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve API documentation
export async function GET() {
  return NextResponse.json({
    description: "Incoming message simulation endpoint for external integrations",
    method: "POST",
    endpoint: "/api/messages/incoming",
    payload: {
      content: {
        type: "string",
        required: true,
        description: "The message content",
      },
      channel: {
        type: "string",
        required: true,
        enum: ["WEB", "WHATSAPP", "EMAIL"],
        description: "The channel the message came from",
      },
      contactId: {
        type: "string",
        required: true,
        description: "Unique identifier for the contact (e.g., phone number, email, user ID)",
      },
      conversationId: {
        type: "string",
        required: false,
        description: "Optional: Add message to existing conversation",
      },
      subject: {
        type: "string",
        required: false,
        description: "Optional: Subject for new conversations",
      },
      metadata: {
        type: "object",
        required: false,
        description: "Optional: Additional metadata",
      },
    },
    exampleRequest: {
      content: "Hello, I need help with my booking",
      channel: "WHATSAPP",
      contactId: "+1234567890",
      subject: "Booking inquiry",
    },
    exampleResponse: {
      success: true,
      data: {
        message: {
          id: "msg_123",
          conversationId: "conv_456",
          channel: "WHATSAPP",
          direction: "INCOMING",
          content: "Hello, I need help with my booking",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        conversationId: "conv_456",
        rulesEvaluated: 3,
        rulesMatched: 1,
        autoReplies: [
          {
            ruleId: "rule_789",
            ruleName: "Booking Inquiry",
            reply: "Thank you for reaching out...",
          },
        ],
      },
    },
  })
}
