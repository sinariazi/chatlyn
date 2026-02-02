"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Zap, MessageSquare, Sparkles } from "lucide-react"
import { toggleRuleActive, deleteRule } from "@/lib/rules-engine/actions"
import type { RuleCondition, RuleAction } from "@/lib/rules-engine/evaluateRules"

interface Rule {
  id: string
  name: string
  description: string | null
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number
  isActive: boolean
  createdAt: Date
}

interface RuleListProps {
  rules: Rule[]
  onEdit: (rule: Rule) => void
}

export function RuleList({ rules, onEdit }: RuleListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleRuleActive(id, isActive)
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      await deleteRule(deleteId)
      setDeleteId(null)
    })
  }

  const getActionIcon = (action: RuleAction) => {
    switch (action.type) {
      case "ai_reply":
        return <Sparkles className="h-3 w-3" />
      case "template_reply":
        return <MessageSquare className="h-3 w-3" />
      default:
        return <Zap className="h-3 w-3" />
    }
  }

  const getActionLabel = (action: RuleAction) => {
    switch (action.type) {
      case "ai_reply":
        return "AI Reply"
      case "template_reply":
        return "Template"
      case "tag":
        return `Tag: ${action.tagName}`
      case "escalate":
        return "Escalate"
      default:
        return action.type
    }
  }

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No rules yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first automation rule to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      Priority: {rule.priority}
                    </Badge>
                  </div>
                  {rule.description && (
                    <CardDescription className="mt-1">
                      {rule.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                    disabled={isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(rule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Keywords: </span>
                  {rule.conditions.map((c, i) => (
                    <Badge key={i} variant="secondary" className="ml-1 text-xs">
                      {c.value}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Actions: </span>
                  {rule.actions.map((action, i) => (
                    <Badge key={i} variant="outline" className="ml-1 gap-1 text-xs">
                      {getActionIcon(action)}
                      {getActionLabel(action)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
