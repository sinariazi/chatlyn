import { prisma } from "../lib/db"

async function main() {
  console.log("Seeding database...")

  // Create sample conversations
  const webConversation = await prisma.conversation.create({
    data: {
      contactId: "contact_web_001",
      channel: "WEB",
      status: "OPEN",
      subject: "Product inquiry",
      metadata: { source: "website", page: "/pricing" },
    },
  })

  const whatsappConversation = await prisma.conversation.create({
    data: {
      contactId: "contact_wa_002",
      channel: "WHATSAPP",
      status: "OPEN",
      subject: null,
      metadata: { phoneNumber: "+1234567890" },
    },
  })

  const emailConversation = await prisma.conversation.create({
    data: {
      contactId: "contact_email_003",
      channel: "EMAIL",
      status: "PENDING",
      subject: "Support request - Order #12345",
      metadata: { email: "customer@example.com" },
    },
  })

  // Create sample messages for web conversation
  await prisma.message.createMany({
    data: [
      {
        conversationId: webConversation.id,
        channel: "WEB",
        direction: "INCOMING",
        content: "Hi, I have a question about your pricing plans.",
        contentType: "TEXT",
        metadata: null,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        conversationId: webConversation.id,
        channel: "WEB",
        direction: "OUTGOING",
        content: "Hello! I'd be happy to help you with pricing information. Which plan are you interested in?",
        contentType: "TEXT",
        metadata: null,
        createdAt: new Date(Date.now() - 3500000),
      },
      {
        conversationId: webConversation.id,
        channel: "WEB",
        direction: "INCOMING",
        content: "I'm looking at the Pro plan. Does it include API access?",
        contentType: "TEXT",
        metadata: null,
        createdAt: new Date(Date.now() - 3400000),
      },
    ],
  })

  // Create sample messages for WhatsApp conversation
  await prisma.message.createMany({
    data: [
      {
        conversationId: whatsappConversation.id,
        channel: "WHATSAPP",
        direction: "INCOMING",
        content: "Hello, is anyone there?",
        contentType: "TEXT",
        metadata: null,
        createdAt: new Date(Date.now() - 1800000), // 30 mins ago
      },
      {
        conversationId: whatsappConversation.id,
        channel: "WHATSAPP",
        direction: "OUTGOING",
        content: "Hi there! Yes, how can I assist you today?",
        contentType: "TEXT",
        metadata: null,
        createdAt: new Date(Date.now() - 1700000),
      },
    ],
  })

  // Create sample messages for email conversation
  await prisma.message.createMany({
    data: [
      {
        conversationId: emailConversation.id,
        channel: "EMAIL",
        direction: "INCOMING",
        content: "Dear Support,\n\nI placed an order #12345 last week but haven't received any shipping confirmation. Could you please check the status?\n\nThank you,\nJohn",
        contentType: "TEXT",
        metadata: null,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    ],
  })

  // Create sample automation rules
  const welcomeRule = await prisma.rule.create({
    data: {
      name: "Auto Welcome Message",
      description: "Send a welcome message when a new conversation starts",
      trigger: "CONVERSATION_OPENED",
      conditions: { channels: ["WEB", "WHATSAPP"] },
      actions: [
        {
          type: "SEND_MESSAGE",
          message: "Welcome! How can we help you today?",
        },
      ],
      priority: 10,
      isActive: true,
    },
  })

  const keywordRule = await prisma.rule.create({
    data: {
      name: "Urgent Keyword Detection",
      description: "Flag conversations containing urgent keywords",
      trigger: "KEYWORD_MATCH",
      conditions: {
        keywords: ["urgent", "emergency", "asap", "immediately"],
        caseSensitive: false,
      },
      actions: [
        { type: "ADD_TAG", tag: "urgent" },
        { type: "NOTIFY_AGENT", priority: "high" },
      ],
      priority: 20,
      isActive: true,
    },
  })

  const businessHoursRule = await prisma.rule.create({
    data: {
      name: "After Hours Auto-Reply",
      description: "Send auto-reply outside business hours",
      trigger: "MESSAGE_RECEIVED",
      conditions: {
        outsideHours: { start: "09:00", end: "17:00", timezone: "UTC" },
      },
      actions: [
        {
          type: "SEND_MESSAGE",
          message: "Thank you for your message. Our team is currently offline and will respond during business hours (9 AM - 5 PM UTC).",
        },
      ],
      priority: 5,
      isActive: false,
    },
  })

  // Create sample analytics events
  await prisma.event.createMany({
    data: [
      {
        type: "CONVERSATION_STARTED",
        conversationId: webConversation.id,
        payload: { source: "website", referrer: "google.com" },
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        type: "MESSAGE_RECEIVED",
        conversationId: webConversation.id,
        payload: { messageCount: 1 },
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        type: "RULE_TRIGGERED",
        conversationId: webConversation.id,
        ruleId: welcomeRule.id,
        payload: { ruleName: "Auto Welcome Message" },
        createdAt: new Date(Date.now() - 3599000),
      },
      {
        type: "AI_RESPONSE_GENERATED",
        conversationId: webConversation.id,
        payload: { model: "gpt-4", tokensUsed: 150, responseTime: 1200 },
        createdAt: new Date(Date.now() - 3500000),
      },
      {
        type: "CONVERSATION_STARTED",
        conversationId: whatsappConversation.id,
        payload: { source: "whatsapp" },
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        type: "MESSAGE_RECEIVED",
        conversationId: emailConversation.id,
        payload: { subject: "Support request - Order #12345" },
        createdAt: new Date(Date.now() - 86400000),
      },
    ],
  })

  console.log("Seeding completed!")
  console.log({
    conversations: 3,
    messages: 6,
    rules: 3,
    events: 6,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
