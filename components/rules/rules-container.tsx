"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RuleList } from "./rule-list"
import { RuleForm } from "./rule-form"
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

interface RulesContainerProps {
  rules: Rule[]
}

export function RulesContainer({ rules }: RulesContainerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule)
    setIsFormOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingRule(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <RuleList rules={rules} onEdit={handleEdit} />

      <RuleForm
        rule={editingRule}
        open={isFormOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  )
}
