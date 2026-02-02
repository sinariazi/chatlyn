"use client"

import React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"
import { createRule, updateRule } from "@/lib/rules-engine/actions"
import type { RuleCondition, RuleAction } from "@/lib/rules-engine/evaluateRules"

interface Rule {
  id: string
  name: string
  description: string | null
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number
  isActive: boolean
}

interface RuleFormProps {
  rule?: Rule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RuleForm({ rule, open, onOpenChange }: RuleFormProps) {
  const isEditing = !!rule
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(rule?.name || "")
  const [description, setDescription] = useState(rule?.description || "")
  const [keywords, setKeywords] = useState<string[]>(
    rule?.conditions.map((c) => c.value) || []
  )
  const [keywordInput, setKeywordInput] = useState("")
  const [actionType, setActionType] = useState<"ai_reply" | "template_reply">(
    (rule?.actions[0]?.type as "ai_reply" | "template_reply") || "ai_reply"
  )
  const [template, setTemplate] = useState(rule?.actions[0]?.template || "")
  const [priority, setPriority] = useState(rule?.priority?.toString() || "0")

  const resetForm = () => {
    setName("")
    setDescription("")
    setKeywords([])
    setKeywordInput("")
    setActionType("ai_reply")
    setTemplate("")
    setPriority("0")
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    } else if (rule) {
      setName(rule.name)
      setDescription(rule.description || "")
      setKeywords(rule.conditions.map((c) => c.value))
      setActionType((rule.actions[0]?.type as "ai_reply" | "template_reply") || "ai_reply")
      setTemplate(rule.actions[0]?.template || "")
      setPriority(rule.priority.toString())
    }
    onOpenChange(open)
  }

  const addKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed])
      setKeywordInput("")
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Rule form submit", { name, keywords, actionType, template })

    if (!name.trim() || keywords.length === 0) return

    const conditions: RuleCondition[] = keywords.map((keyword) => ({
      type: "keyword",
      value: keyword,
      caseSensitive: false,
    }))

    const actions: RuleAction[] = [
      actionType === "ai_reply"
        ? { type: "ai_reply" }
        : { type: "template_reply", template },
    ]

    startTransition(async () => {
      if (isEditing && rule) {
        await updateRule({
          id: rule.id,
          name: name.trim(),
          description: description.trim() || undefined,
          conditions,
          actions,
          priority: parseInt(priority) || 0,
          isActive: rule.isActive,
        })
      } else {
        await createRule({
          name: name.trim(),
          description: description.trim() || undefined,
          conditions,
          actions,
          priority: parseInt(priority) || 0,
        })
      }
      handleOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Create Rule"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the automation rule settings"
              : "Create a new automation rule to handle incoming messages"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Message"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this rule does"
            />
          </div>

          <div className="space-y-2">
            <Label>Trigger Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Enter keyword..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addKeyword()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Rule triggers when message contains any of these keywords
            </p>
          </div>

          <div className="space-y-3">
            <Label>Action</Label>
            <RadioGroup
              value={actionType}
              onValueChange={(v) => setActionType(v as "ai_reply" | "template_reply")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai_reply" id="ai_reply" />
                <Label htmlFor="ai_reply" className="font-normal">
                  Generate AI Reply
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template_reply" id="template_reply" />
                <Label htmlFor="template_reply" className="font-normal">
                  Send Template Reply
                </Label>
              </div>
            </RadioGroup>
          </div>

          {actionType === "template_reply" && (
            <div className="space-y-2">
              <Label htmlFor="template">Reply Template</Label>
              <Textarea
                id="template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Hello! Thank you for reaching out about {{subject}}..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {"{{channel}}"}, {"{{contactId}}"}, {"{{subject}}"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              min="0"
              max="100"
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Higher priority rules are evaluated first
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || keywords.length === 0 || isPending}
              onClick={() => {
                console.log("[v0] Button click - validation:", {
                  nameValid: !!name.trim(),
                  keywordsValid: keywords.length > 0,
                  name,
                  keywords,
                  isPending,
                })
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Rule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
