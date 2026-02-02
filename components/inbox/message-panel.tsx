"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Mail, MessageCircle, Globe, ArrowDownLeft, ArrowUpRight } from "lucide-react"

type Channel = "WEB" | "WHATSAPP" | "EMAIL"
type Direction = "INCOMING" | "OUTGOING"

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
  subject: string | null
}

interface MessagePanelProps {
  conversation: Conversation | null
  messages: Message[]
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

export function MessagePanel({ conversation, messages }: MessagePanelProps) {
  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Select a conversation to view messages
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium">
            {conversation.subject || conversation.contactId}
          </h2>
          <p className="text-xs text-muted-foreground">
            {conversation.contactId}
          </p>
        </div>
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                message.direction === "OUTGOING" && "items-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2",
                  message.direction === "INCOMING"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 text-[10px]",
                    channelColors[message.channel]
                  )}
                >
                  {channelIcons[message.channel]}
                </Badge>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {message.direction === "INCOMING" ? (
                    <ArrowDownLeft className="h-3 w-3" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" />
                  )}
                  {format(new Date(message.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
