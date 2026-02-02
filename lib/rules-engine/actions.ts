"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { RuleCondition, RuleAction } from "./evaluateRules"

interface CreateRuleInput {
  name: string
  description?: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority?: number
}

interface UpdateRuleInput extends CreateRuleInput {
  id: string
  isActive?: boolean
}

export async function getRules() {
  const rules = await prisma.rule.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  })

  return rules.map((rule) => ({
    ...rule,
    conditions: rule.conditions as RuleCondition[],
    actions: rule.actions as RuleAction[],
  }))
}

export async function getRule(id: string) {
  const rule = await prisma.rule.findUnique({
    where: { id },
  })

  if (!rule) return null

  return {
    ...rule,
    conditions: rule.conditions as RuleCondition[],
    actions: rule.actions as RuleAction[],
  }
}

export async function createRule(input: CreateRuleInput) {
  try {
    const rule = await prisma.rule.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        trigger: "KEYWORD_MATCH",
        conditions: input.conditions,
        actions: input.actions,
        priority: input.priority ?? 0,
        isActive: true,
      },
    })

    revalidatePath("/rules")
    return { success: true, rule }
  } catch (error) {
    console.error("Failed to create rule:", error)
    return { success: false, error: "Failed to create rule" }
  }
}

export async function updateRule(input: UpdateRuleInput) {
  try {
    const rule = await prisma.rule.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description ?? null,
        conditions: input.conditions,
        actions: input.actions,
        priority: input.priority ?? 0,
        isActive: input.isActive ?? true,
      },
    })

    revalidatePath("/rules")
    return { success: true, rule }
  } catch (error) {
    console.error("Failed to update rule:", error)
    return { success: false, error: "Failed to update rule" }
  }
}

export async function deleteRule(id: string) {
  try {
    await prisma.rule.delete({
      where: { id },
    })

    revalidatePath("/rules")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete rule:", error)
    return { success: false, error: "Failed to delete rule" }
  }
}

export async function toggleRuleActive(id: string, isActive: boolean) {
  try {
    await prisma.rule.update({
      where: { id },
      data: { isActive },
    })

    revalidatePath("/rules")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle rule:", error)
    return { success: false, error: "Failed to toggle rule" }
  }
}
