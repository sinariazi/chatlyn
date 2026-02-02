"use client"

import React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, Sparkles } from "lucide-react"
import { sendMessage } from "@/lib/messaging/actions"
import { generateReplySuggestion } from "@/lib/ai/generateReply"

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

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

  const handleSuggestReply = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setAiError(null)

    try {
      const result = await generateReplySuggestion(conversationId)

      if (result.success && result.suggestion) {
        setContent(result.suggestion)
      } else {
        setAiError(result.error || "Failed to generate suggestion")
      }
    } catch {
      setAiError("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSuggestReply}
          disabled={isGenerating || isPending}
          className="gap-2 bg-transparent"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Suggest reply"}
        </Button>
        {aiError && (
          <p className="text-xs text-destructive">{aiError}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[80px] resize-none"
          disabled={isPending || isGenerating}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[80px] w-12 shrink-0"
          disabled={!content.trim() || isPending || isGenerating}
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
