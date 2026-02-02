import { PageHeader } from "@/components/dashboard/page-header"
import { PlaceholderContent } from "@/components/dashboard/placeholder-content"

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Analytics" 
        description="Track your messaging performance" 
      />
      <PlaceholderContent feature="Analytics" />
    </div>
  )
}
