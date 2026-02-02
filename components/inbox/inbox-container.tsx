"use client"

import { useState } from "react"
import { ConversationList } from "./conversation-list"
import { MessagePanel, type Message as PanelMessage } from "./message-panel"
import type { ConversationWithMessages, Message as DbMessage } from "@/lib/messaging/types"
import { Message } from "@/lib/messaging/types" // Import Message type

interface InboxContainerProps {
  conversations: ConversationWithMessages[]
}

export function InboxContainer({ conversations: initialConversations }: InboxContainerProps) {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id || null
  )

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null
  
  // Convert database messages to panel messages
  const messages: PanelMessage[] = selectedConversation?.messages.map((msg) => ({
    id: msg.id,
    channel: msg.channel,
    direction: msg.direction,
    content: msg.content,
    createdAt: msg.createdAt,
  })) || []

  const handleMessageSent = (message: PanelMessage) => {
    // Convert panel message to database message format
    const dbMessage: DbMessage = {
      ...message,
      conversationId: selectedId!,
      contentType: "TEXT",
      metadata: null,
    }
    
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedId) {
          return {
            ...conv,
            messages: [...conv.messages, dbMessage],
            updatedAt: new Date(),
          }
        }
        return conv
      })
    )
  }

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
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  )
}
