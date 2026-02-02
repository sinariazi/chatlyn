"use client"

import React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { sendMessage } from "@/lib/messaging/actions"

interface ReplyComposerProps {
  conversationId: string
  onMessageSent: (message: {
    id: string
    channel: "WEB" | "WHATSAPP" | "EMAIL"
    direction: "INCOMING" | "OUTGOING"
    content: string
    createdAt: Date
  }) => void
}

export function ReplyComposer({ conversationId, onMessageSent }: ReplyComposerProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isPending) return

    startTransition(async () => {
      const result = await sendMessage({
        conversationId,
        content: content.trim(),
      })

      if (result.success && result.message) {
        onMessageSent({
          id: result.message.id,
          channel: result.message.channel,
          direction: result.message.direction,
          content: result.message.content,
          createdAt: result.message.createdAt,
        })
        setContent("")
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[80px] resize-none"
          disabled={isPending}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-[80px] w-12 shrink-0"
          disabled={!content.trim() || isPending}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  )
}
