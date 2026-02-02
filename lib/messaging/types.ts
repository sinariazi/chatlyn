import type { Conversation as DbConversation, Message as DbMessage } from "@/lib/db"

// Re-export database types
export type { Channel, Direction, ConversationStatus, ContentType } from "@/lib/db"

// Conversation with messages included
export type ConversationWithMessages = DbConversation & {
  messages: DbMessage[]
}

// Message type for components
export type MessageType = DbMessage
