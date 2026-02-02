"use client"

import { useState } from "react"
import { ConversationList } from "./conversation-list"
import { MessagePanel } from "./message-panel"

type Channel = "WEB" | "WHATSAPP" | "EMAIL"
type Direction = "INCOMING" | "OUTGOING"
type ConversationStatus = "OPEN" | "CLOSED" | "PENDING" | "ARCHIVED"

interface Message {
  id: string
  channel: Channel
  direction: Direction
  content: string
  createdAt: Date
}

interface Conversation {
  id: string
  contactId: string
  channel: Channel
  status: ConversationStatus
  subject: string | null
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

interface InboxContainerProps {
  conversations: Conversation[]
}

export function InboxContainer({ conversations }: InboxContainerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id || null
  )

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null
  const messages = selectedConversation?.messages || []

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-card">
      {/* Conversation List */}
      <div className="w-80 shrink-0 border-r">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-medium">Conversations</h3>
          <p className="text-xs text-muted-foreground">
            {conversations.length} total
          </p>
        </div>
        <div className="h-[calc(100%-3.5rem)]">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {/* Message Panel */}
      <div className="flex-1">
        <MessagePanel
          conversation={selectedConversation}
          messages={messages}
        />
      </div>
    </div>
  )
}
