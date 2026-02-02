import type { Conversation as DbConversation, Message as DbMessage } from "@/lib/db"

// Re-export database types
export type { Channel, Direction, ConversationStatus, ContentType } from "@/lib/db"

// Re-export base types
export type Conversation = DbConversation
export type Message = DbMessage

// Conversation with messages included
export type ConversationWithMessages = DbConversation & {
  messages: DbMessage[]
}

// Message type for components
export type MessageType = DbMessage
