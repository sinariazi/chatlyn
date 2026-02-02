# Chatlyn

AI-powered multi-channel messaging platform for hospitality. Unifies conversations across web, WhatsApp, and email with intelligent automation and analytics.

## Product Vision

Replace fragmented guest communication with a single, automation-first inbox that reduces response time without sacrificing hospitality tone. Reduce response time through AI-assisted replies and rule-based automation while maintaining the personal touch hospitality requires.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                       │
├─────────────────────────────────────────────────────────────────┤
│  /(dashboard)          │  /api                                   │
│  ├── inbox             │  ├── messages/incoming (webhook sim)    │
│  ├── analytics         │  └── health                             │
│  └── rules             │                                         │
├─────────────────────────────────────────────────────────────────┤
│                           /lib                                   │
│  ├── messaging/    → Conversation & message CRUD, server actions │
│  ├── ai/           → OpenAI integration, reply generation        │
│  ├── rules-engine/ → Keyword matching, action execution          │
│  └── analytics/    → Event tracking, metrics aggregation         │
├─────────────────────────────────────────────────────────────────┤
│                     Prisma + PostgreSQL                          │
│  Conversation → Message → Event ← Rule                           │
└─────────────────────────────────────────────────────────────────┘
This structure intentionally keeps domain logic isolated from framework concerns to make architectural decisions explicit, reviewable, and enforceable at scale.
```

**Data Flow (Incoming Message):**
1. External system POSTs to `/api/messages/incoming`
2. Message persisted, conversation created/updated
3. Rules engine evaluates active rules by priority
4. Matching rules execute actions (template reply, AI generation)
5. Events logged for analytics
6. Client revalidated via Next.js cache

## Folder Responsibilities

| Path | Responsibility |
|------|----------------|
| `app/(dashboard)/` | Route group for authenticated views. Shared layout with sidebar. |
| `app/api/` | External integration endpoints. Stateless, no session required. |
| `components/inbox/` | Conversation list, message panel, reply composer, simulator. |
| `components/rules/` | Rule CRUD UI, form validation, list management. |
| `components/analytics/` | Stat cards, Recharts-based visualizations. |
| `lib/messaging/` | `actions.ts` (server actions), `queries.ts` (read operations). |
| `lib/ai/` | `generateReply.ts` wraps AI SDK with hospitality system prompt. |
| `lib/rules-engine/` | `evaluateRules.ts` (condition matching), `actions.ts` (CRUD). |
| `lib/analytics/` | `trackEvent.ts` (generic tracker), `queries.ts` (aggregations). |
| `prisma/` | Schema definition, seed data for development. |

## AI Integration Strategy

**Approach:** AI as augmentation, not replacement.

- **Suggest, don't send.** AI generates draft replies inserted into composer. Human reviews before sending.
- **Rule-triggered AI.** Rules can auto-generate contextual replies for specific keywords (e.g., "urgent", "complaint").
- **Hospitality tone.** System prompt enforces warm, professional language appropriate for guest communication.

**Implementation:**
- Vercel AI SDK 6 with `generateText` (non-streaming for suggestions)
- 30-second timeout via `AbortController`
- Graceful degradation: AI failure doesn't block manual reply

```typescript
// lib/ai/generateReply.ts
const { text } = await generateText({
  model: "openai/gpt-4o-mini",
  system: HOSPITALITY_SYSTEM_PROMPT,
  messages: conversationHistory,
  abortSignal: AbortSignal.timeout(30000),
})
```

## Tradeoffs Made

| Decision | Tradeoff | Rationale |
|----------|----------|-----------|
| Server Actions over API routes | Tighter coupling to Next.js | Simpler RPC pattern, automatic revalidation |
| Prisma over raw SQL | Runtime overhead, N+1 risk | Type safety, rapid iteration |
| Client state for inbox | Optimistic UI complexity | Immediate feedback without WebSocket infra |
| Single AI provider | Vendor lock-in | Faster shipping; AI SDK abstracts provider |
| Keyword matching over NLP | Less sophisticated matching | Predictable behavior, no ML ops overhead |
| No real-time sync | Stale data possible | Polling/refresh acceptable for MVP scale |

## What Changes at 10x Scale

**Current:** ~100 conversations/day, single-user operation.

**At 10x (1,000+ conversations/day):**

| Area | Current | At Scale |
|------|---------|----------|
| **Database** | Single Prisma client | Connection pooling (PgBouncer), read replicas |
| **Real-time** | Manual refresh | WebSocket/SSE for live updates, Pusher/Ably |
| **Rules Engine** | In-process evaluation | Background jobs (Inngest/Trigger.dev), rule prioritization queue |
| **AI** | Sync generation | Streaming responses, response caching, fallback models |
**Cost controls** | per-org AI quotas | caching of frequent intents, and tier-based model selection |
| **Analytics** | Live aggregation | Pre-computed rollups, time-series DB (TimescaleDB) |
| **Search** | DB queries | Full-text search (Postgres FTS → Elasticsearch) |
| **Multi-tenancy** | None | Org/workspace isolation, RLS policies |
| **Auth** | None | Supabase Auth or Auth.js with RBAC |

**Architectural shifts:**
- Extract rules engine to separate service for independent scaling
- Event-driven architecture: message receipt → queue → workers
- CQRS pattern: separate read/write models for inbox
- CDN-cached analytics dashboards with background refresh

## Development

```bash
# Install dependencies
pnpm install

# Set up database
pnpm prisma migrate dev
pnpm prisma db seed

# Run development server
pnpm dev
```

**Environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For AI reply suggestions (optional)

## License

Private. All rights reserved.
