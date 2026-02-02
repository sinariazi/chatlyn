"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { TestTube, Loader2, Zap } from "lucide-react"
import { receiveMessage } from "@/lib/messaging/actions"

interface MessageSimulatorProps {
  conversationId: string
  onMessageReceived: (message: {
    id: string
    channel: "WEB" | "WHATSAPP" | "EMAIL"
    direction: "INCOMING" | "OUTGOING"
    content: string
    createdAt: Date
  }, autoReply?: {
    id: string
    channel: "WEB" | "WHATSAPP" | "EMAIL"
    direction: "INCOMING" | "OUTGOING"
    content: string
    createdAt: Date
  }) => void
}

export function MessageSimulator({ conversationId, onMessageReceived }: MessageSimulatorProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [lastResult, setLastResult] = useState<{
    rulesMatched: number
    autoReply?: string
  } | null>(null)

  const handleSimulate = () => {
    if (!content.trim()) return

    startTransition(async () => {
      const result = await receiveMessage({ conversationId, content: content.trim() })
      
      if (result.success && result.message) {
        const rulesMatched = result.ruleResults?.filter((r) => r.matched).length ?? 0
        setLastResult({
          rulesMatched,
          autoReply: result.autoReply,
        })

        // Add the incoming message
        onMessageReceived(result.message)

        // If there's an auto-reply, fetch it and add it
        if (result.autoReply) {
          // Small delay to make the auto-reply feel more natural
          setTimeout(() => {
            const autoReplyMessage = {
              id: `auto-${Date.now()}`,
              channel: result.message!.channel,
              direction: "OUTGOING" as const,
              content: result.autoReply!,
              createdAt: new Date(),
            }
            onMessageReceived(autoReplyMessage, autoReplyMessage)
          }, 500)
        }

        setContent("")
      }
    })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <TestTube className="h-4 w-4" />
          Simulate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">Simulate Incoming Message</h4>
            <p className="text-xs text-muted-foreground">
              Test how rules respond to incoming messages
            </p>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a test message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSimulate()
                }
              }}
              disabled={isPending}
            />
            <Button onClick={handleSimulate} disabled={!content.trim() || isPending} size="sm">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>

          {lastResult && (
            <div className="rounded-md bg-muted p-2 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span>{lastResult.rulesMatched} rule(s) matched</span>
              </div>
              {lastResult.autoReply && (
                <Badge variant="secondary" className="mt-1">
                  Auto-reply generated
                </Badge>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Try keywords like &quot;help&quot;, &quot;urgent&quot;, or &quot;booking&quot; to trigger rules
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
