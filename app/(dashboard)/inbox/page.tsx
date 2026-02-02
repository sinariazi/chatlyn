import { PageHeader } from "@/components/dashboard/page-header"
import { InboxContainer } from "@/components/inbox/inbox-container"
import { getConversationsWithMessages } from "@/lib/messaging/queries"

export default async function InboxPage() {
  const conversations = await getConversationsWithMessages()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Inbox"
        description="View and manage your messages"
      />
      <InboxContainer conversations={conversations} />
    </div>
  )
}
