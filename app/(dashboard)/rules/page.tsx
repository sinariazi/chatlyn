import { PageHeader } from "@/components/dashboard/page-header"
import { RulesContainer } from "@/components/rules/rules-container"
import { getRules } from "@/lib/rules-engine/actions"

export default async function RulesPage() {
  const rules = await getRules()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Rules"
        description="Configure automation rules for incoming messages"
      />
      <RulesContainer rules={rules} />
    </div>
  )
}
