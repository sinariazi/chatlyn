import { PageHeader } from "@/components/dashboard/page-header"
import { PlaceholderContent } from "@/components/dashboard/placeholder-content"

export default function InboxPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Inbox" 
        description="View and manage your messages" 
      />
      <PlaceholderContent feature="Inbox" />
    </div>
  )
}
