"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { Mail, MessageCircle, Globe } from "lucide-react"

type Channel = "WEB" | "WHATSAPP" | "EMAIL"
type ConversationStatus = "OPEN" | "CLOSED" | "PENDING" | "ARCHIVED"

interface ConversationWithLastMessage {
  id: string
  contactId: string
  channel: Channel
  status: ConversationStatus
  subject: string | null
  createdAt: Date
  updatedAt: Date
  messages: {
    content: string
    createdAt: Date
  }[]
}

interface ConversationListProps {
  conversations: ConversationWithLastMessage[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const channelIcons: Record<Channel, React.ReactNode> = {
  WEB: <Globe className="h-3.5 w-3.5" />,
  WHATSAPP: <MessageCircle className="h-3.5 w-3.5" />,
  EMAIL: <Mail className="h-3.5 w-3.5" />,
}

const channelColors: Record<Channel, string> = {
  WEB: "bg-blue-500/10 text-blue-600 border-blue-200",
  WHATSAPP: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  EMAIL: "bg-amber-500/10 text-amber-600 border-amber-200",
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-2">
        {conversations.map((conversation) => {
          const lastMessage = conversation.messages[0]
          const isSelected = selectedId === conversation.id

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary/20 bg-primary/5"
                  : "border-transparent hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {conversation.subject || conversation.contactId}
                </span>
                <Badge
                  variant="outline"
                  className={cn("shrink-0", channelColors[conversation.channel])}
                >
                  {channelIcons[conversation.channel]}
                  <span className="ml-1 text-[10px] uppercase">
                    {conversation.channel}
                  </span>
                </Badge>
              </div>
              {lastMessage && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {lastMessage.content}
                </p>
              )}
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    conversation.status === "OPEN" && "bg-emerald-500/10 text-emerald-600",
                    conversation.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                    conversation.status === "CLOSED" && "bg-muted text-muted-foreground"
                  )}
                >
                  {conversation.status}
                </Badge>
                {lastMessage && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
