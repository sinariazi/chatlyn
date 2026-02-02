import { PageHeader } from "@/components/dashboard/page-header"
import { PlaceholderContent } from "@/components/dashboard/placeholder-content"

export default function RulesPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Rules" 
        description="Configure automation rules" 
      />
      <PlaceholderContent feature="Rules" />
    </div>
  )
}
