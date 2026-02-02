// Mock database layer for v0 environment
// In production, replace with actual Prisma client

export type Channel = "WEB" | "WHATSAPP" | "EMAIL"
export type Direction = "INCOMING" | "OUTGOING"
export type ContentType = "TEXT" | "IMAGE" | "FILE" | "TEMPLATE"
export type ConversationStatus = "OPEN" | "CLOSED" | "PENDING" | "ARCHIVED"
export type RuleTrigger = "MESSAGE_RECEIVED" | "KEYWORD_MATCH" | "TIME_BASED" | "CHANNEL_SPECIFIC"
export type EventType = "MESSAGE_RECEIVED" | "MESSAGE_SENT" | "AI_RESPONSE_GENERATED" | "RULE_TRIGGERED" | "RULE_EXECUTED" | "CONVERSATION_STARTED" | "CONVERSATION_RESOLVED"

export interface Conversation {
  id: string
  contactId: string
  channel: Channel
  status: ConversationStatus
  subject: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  channel: Channel
  direction: Direction
  content: string
  contentType: ContentType
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface Rule {
  id: string
  name: string
  description: string | null
  trigger: RuleTrigger
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  priority: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  type: EventType
  conversationId: string | null
  ruleId: string | null
  payload: Record<string, unknown>
  createdAt: Date
}

// In-memory store
const store = {
  conversations: new Map<string, Conversation>(),
  messages: new Map<string, Message>(),
  rules: new Map<string, Rule>(),
  events: new Map<string, Event>(),
}

// Initialize with seed data
function initializeStore() {
  if (store.conversations.size > 0) return

  // Seed conversations
  const conversations: Conversation[] = [
    {
      id: "conv-1",
      contactId: "guest-john@hotel.com",
      channel: "EMAIL",
      status: "OPEN",
      subject: "Room Service Request",
      metadata: {},
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:30:00Z"),
    },
    {
      id: "conv-2",
      contactId: "+1234567890",
      channel: "WHATSAPP",
      status: "OPEN",
      subject: null,
      metadata: {},
      createdAt: new Date("2024-01-15T09:00:00Z"),
      updatedAt: new Date("2024-01-15T09:45:00Z"),
    },
    {
      id: "conv-3",
      contactId: "web-visitor-abc123",
      channel: "WEB",
      status: "PENDING",
      subject: "Booking Inquiry",
      metadata: {},
      createdAt: new Date("2024-01-14T14:00:00Z"),
      updatedAt: new Date("2024-01-14T14:20:00Z"),
    },
  ]

  // Seed messages
  const messages: Message[] = [
    {
      id: "msg-1",
      conversationId: "conv-1",
      channel: "EMAIL",
      direction: "INCOMING",
      content: "Hello, I would like to request room service for breakfast tomorrow at 8 AM.",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-15T10:00:00Z"),
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      channel: "EMAIL",
      direction: "OUTGOING",
      content: "Good morning! Thank you for reaching out. I'd be happy to arrange breakfast room service for you at 8 AM tomorrow. Could you please let me know your room number and any dietary preferences?",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-15T10:15:00Z"),
    },
    {
      id: "msg-3",
      conversationId: "conv-1",
      channel: "EMAIL",
      direction: "INCOMING",
      content: "Room 412. I'm vegetarian and would like the continental breakfast with fresh orange juice.",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-15T10:30:00Z"),
    },
    {
      id: "msg-4",
      conversationId: "conv-2",
      channel: "WHATSAPP",
      direction: "INCOMING",
      content: "Hi! What time is checkout?",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-15T09:00:00Z"),
    },
    {
      id: "msg-5",
      conversationId: "conv-2",
      channel: "WHATSAPP",
      direction: "OUTGOING",
      content: "Hello! Our standard checkout time is 11:00 AM. If you need a late checkout, please let us know and we'll do our best to accommodate you.",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-15T09:15:00Z"),
    },
    {
      id: "msg-6",
      conversationId: "conv-2",
      channel: "WHATSAPP",
      direction: "INCOMING",
      content: "Can I get a late checkout until 2 PM?",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-15T09:45:00Z"),
    },
    {
      id: "msg-7",
      conversationId: "conv-3",
      channel: "WEB",
      direction: "INCOMING",
      content: "I'm looking to book a suite for next weekend. Do you have availability?",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-14T14:00:00Z"),
    },
    {
      id: "msg-8",
      conversationId: "conv-3",
      channel: "WEB",
      direction: "OUTGOING",
      content: "Thank you for your interest! Let me check our availability for next weekend. Which dates specifically are you looking at, and how many guests will be staying?",
      contentType: "TEXT",
      metadata: {},
      createdAt: new Date("2024-01-14T14:20:00Z"),
    },
  ]

  // Seed rules
  const rules: Rule[] = [
    {
      id: "rule-1",
      name: "Welcome Message",
      description: "Send welcome message to new conversations",
      trigger: "MESSAGE_RECEIVED",
      conditions: [
        { type: "keyword", value: "hello" },
        { type: "keyword", value: "hi" },
        { type: "keyword", value: "hey" },
      ],
      actions: [
        { type: "template_reply", template: "Welcome to our hotel! How may I assist you today?" },
      ],
      priority: 1,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "rule-2",
      name: "Urgent Request Handler",
      description: "Flag and respond to urgent requests",
      trigger: "KEYWORD_MATCH",
      conditions: [
        { type: "keyword", value: "urgent" },
        { type: "keyword", value: "emergency" },
        { type: "keyword", value: "asap" },
        { type: "keyword", value: "immediately" },
      ],
      actions: [
        { type: "ai_reply" },
      ],
      priority: 10,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "rule-3",
      name: "Checkout Info",
      description: "Auto-reply with checkout information",
      trigger: "KEYWORD_MATCH",
      conditions: [
        { type: "keyword", value: "checkout" },
      ],
      actions: [
        { type: "template_reply", template: "Our standard checkout time is 11:00 AM. Late checkout may be available upon request." },
      ],
      priority: 5,
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
  ]

  // Seed events
  const events: Event[] = [
    { id: "evt-1", type: "MESSAGE_RECEIVED", conversationId: "conv-1", ruleId: null, payload: { messageId: "msg-1" }, createdAt: new Date("2024-01-15T10:00:00Z") },
    { id: "evt-2", type: "MESSAGE_SENT", conversationId: "conv-1", ruleId: null, payload: { messageId: "msg-2" }, createdAt: new Date("2024-01-15T10:15:00Z") },
    { id: "evt-3", type: "MESSAGE_RECEIVED", conversationId: "conv-1", ruleId: null, payload: { messageId: "msg-3" }, createdAt: new Date("2024-01-15T10:30:00Z") },
    { id: "evt-4", type: "MESSAGE_RECEIVED", conversationId: "conv-2", ruleId: null, payload: { messageId: "msg-4" }, createdAt: new Date("2024-01-15T09:00:00Z") },
    { id: "evt-5", type: "MESSAGE_SENT", conversationId: "conv-2", ruleId: null, payload: { messageId: "msg-5" }, createdAt: new Date("2024-01-15T09:15:00Z") },
    { id: "evt-6", type: "MESSAGE_RECEIVED", conversationId: "conv-2", ruleId: null, payload: { messageId: "msg-6" }, createdAt: new Date("2024-01-15T09:45:00Z") },
    { id: "evt-7", type: "MESSAGE_RECEIVED", conversationId: "conv-3", ruleId: null, payload: { messageId: "msg-7" }, createdAt: new Date("2024-01-14T14:00:00Z") },
    { id: "evt-8", type: "MESSAGE_SENT", conversationId: "conv-3", ruleId: null, payload: { messageId: "msg-8" }, createdAt: new Date("2024-01-14T14:20:00Z") },
    { id: "evt-9", type: "RULE_TRIGGERED", conversationId: "conv-2", ruleId: "rule-3", payload: { messageId: "msg-4" }, createdAt: new Date("2024-01-15T09:00:00Z") },
    { id: "evt-10", type: "AI_RESPONSE_GENERATED", conversationId: "conv-1", ruleId: null, payload: { suggestionUsed: true }, createdAt: new Date("2024-01-15T10:14:00Z") },
  ]

  conversations.forEach((c) => store.conversations.set(c.id, c))
  messages.forEach((m) => store.messages.set(m.id, m))
  rules.forEach((r) => store.rules.set(r.id, r))
  events.forEach((e) => store.events.set(e.id, e))
}

initializeStore()

// Mock Prisma-like API
export const prisma = {
  conversation: {
    findMany: async (args?: { orderBy?: Record<string, string>; include?: { messages?: boolean | Record<string, unknown> } }) => {
      let conversations = Array.from(store.conversations.values())
      if (args?.orderBy?.updatedAt === "desc") {
        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      }
      if (args?.include?.messages) {
        return conversations.map((c) => ({
          ...c,
          messages: Array.from(store.messages.values())
            .filter((m) => m.conversationId === c.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        }))
      }
      return conversations
    },
    findUnique: async (args: { where: { id: string }; select?: Record<string, boolean> }) => {
      return store.conversations.get(args.where.id) || null
    },
    findFirst: async (args: { where: { contactId: string; channel: Channel } }) => {
      return Array.from(store.conversations.values()).find(
        (c) => c.contactId === args.where.contactId && c.channel === args.where.channel
      ) || null
    },
    create: async (args: { data: Omit<Conversation, "id" | "createdAt" | "updatedAt"> & { id?: string } }) => {
      const conversation: Conversation = {
        id: args.data.id || `conv-${Date.now()}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Conversation
      store.conversations.set(conversation.id, conversation)
      return conversation
    },
    update: async (args: { where: { id: string }; data: Partial<Conversation> }) => {
      const existing = store.conversations.get(args.where.id)
      if (!existing) return null
      const updated = { ...existing, ...args.data, updatedAt: new Date() }
      store.conversations.set(args.where.id, updated)
      return updated
    },
    count: async () => store.conversations.size,
  },
  message: {
    findMany: async (args?: { where?: { conversationId?: string }; orderBy?: Record<string, string> }) => {
      let messages = Array.from(store.messages.values())
      if (args?.where?.conversationId) {
        messages = messages.filter((m) => m.conversationId === args.where?.conversationId)
      }
      if (args?.orderBy?.createdAt === "asc") {
        messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      } else if (args?.orderBy?.createdAt === "desc") {
        messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
      return messages
    },
    findUnique: async (args: { where: { id: string }; include?: { conversation?: boolean } }) => {
      const message = store.messages.get(args.where.id)
      if (!message) return null
      if (args.include?.conversation) {
        return { ...message, conversation: store.conversations.get(message.conversationId) }
      }
      return message
    },
    create: async (args: { data: Omit<Message, "id" | "createdAt" | "metadata"> & { metadata?: Record<string, unknown> } }) => {
      const message: Message = {
        id: `msg-${Date.now()}`,
        ...args.data,
        metadata: args.data.metadata || {},
        createdAt: new Date(),
      }
      store.messages.set(message.id, message)
      return message
    },
    count: async (args?: { where?: { direction?: Direction } }) => {
      if (args?.where?.direction) {
        return Array.from(store.messages.values()).filter((m) => m.direction === args.where?.direction).length
      }
      return store.messages.size
    },
  },
  rule: {
    findMany: async (args?: { where?: { isActive?: boolean }; orderBy?: Record<string, string> }) => {
      let rules = Array.from(store.rules.values())
      if (args?.where?.isActive !== undefined) {
        rules = rules.filter((r) => r.isActive === args.where?.isActive)
      }
      if (args?.orderBy?.priority === "desc") {
        rules.sort((a, b) => b.priority - a.priority)
      } else if (args?.orderBy?.createdAt === "desc") {
        rules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
      return rules
    },
    findUnique: async (args: { where: { id: string } }) => {
      return store.rules.get(args.where.id) || null
    },
    create: async (args: { data: Omit<Rule, "id" | "createdAt" | "updatedAt"> }) => {
      const rule: Rule = {
        id: `rule-${Date.now()}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      store.rules.set(rule.id, rule)
      return rule
    },
    update: async (args: { where: { id: string }; data: Partial<Rule> }) => {
      const existing = store.rules.get(args.where.id)
      if (!existing) return null
      const updated = { ...existing, ...args.data, updatedAt: new Date() }
      store.rules.set(args.where.id, updated)
      return updated
    },
    delete: async (args: { where: { id: string } }) => {
      const existing = store.rules.get(args.where.id)
      if (existing) store.rules.delete(args.where.id)
      return existing
    },
    count: async () => store.rules.size,
  },
  event: {
    findMany: async (args?: { where?: { type?: EventType | { in: EventType[] } }; orderBy?: Record<string, string> }) => {
      let events = Array.from(store.events.values())
      if (args?.where?.type) {
        if (typeof args.where.type === "string") {
          events = events.filter((e) => e.type === args.where?.type)
        } else if ("in" in args.where.type) {
          events = events.filter((e) => (args.where?.type as { in: EventType[] }).in.includes(e.type))
        }
      }
      if (args?.orderBy?.createdAt === "desc") {
        events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
      return events
    },
    create: async (args: { data: Omit<Event, "id" | "createdAt"> }) => {
      const event: Event = {
        id: `evt-${Date.now()}`,
        ...args.data,
        createdAt: new Date(),
      }
      store.events.set(event.id, event)
      return event
    },
    count: async (args?: { where?: { type?: EventType | { in: EventType[] } } }) => {
      if (args?.where?.type) {
        if (typeof args.where.type === "string") {
          return Array.from(store.events.values()).filter((e) => e.type === args.where?.type).length
        } else if ("in" in args.where.type) {
          return Array.from(store.events.values()).filter((e) => (args.where?.type as { in: EventType[] }).in.includes(e.type)).length
        }
      }
      return store.events.size
    },
    groupBy: async (args: { by: string[]; _count: boolean }) => {
      const events = Array.from(store.events.values())
      const grouped = new Map<string, number>()
      for (const event of events) {
        const key = args.by.map((k) => event[k as keyof Event]).join("-")
        grouped.set(key, (grouped.get(key) || 0) + 1)
      }
      return Array.from(grouped.entries()).map(([key, count]) => {
        const values = key.split("-")
        const result: Record<string, unknown> = { _count: count }
        args.by.forEach((k, i) => {
          result[k] = values[i]
        })
        return result
      })
    },
  },
}

export default prisma
