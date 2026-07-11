# ConvoAssistBot — Monolithic Mini App Design

> **Goal:** Transform the abandoned monorepo into a single Next.js app running a Telegram bot with Mini App UI for voice transcription, conversation summaries, and user privacy controls.

## Architecture

A single Next.js (App Router) application running on Node.js + Yarn. The Telegram bot starts via `instrumentation.ts` in the same process as the API server. Database is PGlite (embeddable PostgreSQL via Drizzle ORM). The Mini App UI is served as standard Next.js pages, authenticated via Telegram init data validation.

**Tech stack:**
- Runtime: Node.js (no Bun)
- Package manager: Yarn 4
- Framework: Next.js 16 (App Router)
- Bot: Telegraf 4
- Database: PGlite + Drizzle ORM
- API middleware: Hono (via Next.js route handlers)
- Auth: Telegram Mini App init data + JWT
- AI: OpenAI (Whisper for transcription, GPT-4.1-mini for refinement/summary)
- UI: React 19, Tailwind CSS 4, shadcn/ui-style components, react-hook-form

## Project Structure

```
convoassistbot/
├── package.json              # Single package (was packages/frontend/package.json)
├── tsconfig.json             # From packages/frontend
├── next.config.ts
├── drizzle.config.ts
├── Dockerfile                # Rewrite: node:22-alpine + yarn, not Bun
├── entrypoint.sh
├── build.sh                  # Keep as-is — server build mechanism
├── compose.yaml              # Keep — update for Node image
├── .env.example
├── .yarn/                    # Keep — yarn 4
├── .yarnrc.yml
│
├── app/                      # Next.js App Router (was packages/frontend/app)
│   ├── layout.tsx
│   ├── page.tsx              # Chat list
│   ├── globals.css
│   ├── favicon.ico
│   ├── chats/[id]/page.tsx   # Chat settings (privacy toggles)
│   └── api/[...path]/route.ts  # Hono API
│
├── components/               # UI components (was packages/frontend/components)
│   ├── ui/                   # button, input, switch, label, item, separator, avatar
│   ├── providers/
│   │   └── auth.tsx          # Mini App auth — FIX state machine
│   └── widgets/
│       └── header.tsx
│
├── api-sdk/                  # API client (was packages/frontend/api-sdk)
│   ├── index.ts
│   └── methods/
│       ├── auth.ts
│       └── chats.ts
│
├── bot/                      # Telegram bot (port from packages/bot + existing frontend/bot)
│   ├── index.ts              # Telegraf setup, launch
│   ├── middleware/
│   │   ├── ignore-old-messages.ts
│   │   ├── context-collector.ts   # Extend: check privacy prefs
│   │   ├── admin-guard.ts
│   │   ├── command.ts             # Ported
│   │   ├── history.ts             # Ported, adapt to new schema
│   │   ├── summary.ts             # Ported
│   │   ├── transcribe.ts          # Ported
│   │   └── privacy.ts             # NEW
│   └── lib/
│       ├── transcriber.ts    # Ported from packages/bot
│       ├── refiner.ts        # Ported
│       └── openai.ts         # Ported
│
├── db/                       # Database (was packages/frontend/db)
│   ├── index.ts
│   ├── schema/
│   │   ├── _common.ts        # essentials(), essentialsWithTgId()
│   │   ├── chats.sql.ts      # Simplified: no balanceId
│   │   ├── users.sql.ts      # Simplified: no balanceId, add privacy fields
│   │   └── messages.sql.ts   # Simplified: no separate junction table
│   ├── queries/
│   │   ├── chats/            # find-or-create-chat, is-user-admin, etc.
│   │   ├── users/            # find-or-create-user
│   │   └── messages/         # NEW — store, list, delete
│   └── drizzle/              # Migration files
│
├── types/                    # Shared types (was packages/frontend/types)
│   ├── api.ts
│   ├── chats.ts
│   └── db.ts
│
├── lib/                      # Frontend utilities (was packages/frontend/lib)
├── public/                   # Static assets
│
├── instrumentation.ts        # Bot starts here
│
└── (no packages/)            # Monorepo flattened — packages/bot deleted, packages/frontend/* moved to root
```

## Database Schema

### chats

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, defaultRandom |
| tg_id | bigint | Unique, Telegram chat ID |
| title | text | nullable |
| type | "group" | "private" | |
| settings | jsonb | transcribe, summarize, storeMessages |
| created_at | timestamp | |
| updated_at | timestamp | |

### users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, defaultRandom |
| tg_id | bigint | Unique, Telegram user ID |
| first_name | text | nullable |
| last_name | text | nullable |
| username | text | nullable |
| privacy_settings | jsonb | globallyOptedOut: boolean |
| created_at | timestamp | |
| updated_at | timestamp | |

### messages

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, defaultRandom |
| tg_id | bigint | Telegram message ID |
| text | text | nullable — null if hiddenForPrivacy |
| is_hidden_for_privacy | boolean | default false |
| chat_id | uuid | FK → chats.id, cascade delete |
| user_id | uuid | FK → users.id |
| chat_tg_id | bigint | For fast deletion by chat admin |
| user_tg_id | bigint | nullable — for anonymous senders |
| original_created_at | timestamp | Telegram message date |
| created_at | timestamp | |
| updated_at | timestamp | |

### chat_to_user (junction)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| chat_id | uuid | FK → chats.id |
| user_id | uuid | FK → users.id |
| role | "member" | "administrator" | "creator" |
| opted_out | boolean | default false — per-chat opt-out |
| created_at | timestamp | |
| updated_at | timestamp | |

Unique constraint on (chat_id, user_id).

## Bot Architecture

**Startup:** `instrumentation.ts` imports `bot/index.ts` and calls `bot.launch()` on nodejs runtime.

**Middleware pipeline (order matters):**

1. `ignoreOldMessages` — Skip messages > 60s old
2. `contextCollector` — DB lookup/create for user + chat, attach `ctx.userData` and `ctx.chatData`. Check user's global privacy prefs.
3. `command` — Parse bot command, attach `ctx.systems.command`
4. `history` — If chat has `summarize` enabled and user hasn't opted out (per-chat or global), store message. If opted out, store with `text: null, isHiddenForPrivacy: true`.
5. `transcribe` — If voice/video message, transcribe via Whisper, refine via GPT, edit message with result. Store transcription as message in history.
6. `summary` — On `/summary [N]`, fetch last N messages, summarize via GPT, reply.
7. `privacy` — On `/privacy`, reply with Mini App link and brief instructions.

**Commands:**
- `/start` — welcome message
- `/summary [N]` — summarize last N messages (default 100)
- `/privacy` — link to Mini App settings + instructions

**New member handler:**
- Listen for `chat_member` update where `new_chat_member` joins
- Send: "👋 Welcome! This bot stores messages to generate summaries. You can opt out anytime in settings. [Mini App link]"

**Settings (via Mini App, not bot):**
- Chat admins: toggle transcribe, toggle summarize, message retention limits
- Users: opt-out per chat, opt-out globally, delete my data
- Chat admins: delete chat data

## API Routes

All under `/api`, handled by Hono router.

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| /auth/mini-app | POST | Init data | Auth via Telegram Mini App |
| /auth/oauth | POST | OAuth | Auth via Telegram Login Widget |
| /chats | GET | JWT | List user's chats (admin/creator) |
| /chats/:id | GET | JWT | Get chat settings |
| /chats/:id/settings | PATCH | JWT | Update chat settings (admin only) |
| /chats/:id/users/me | GET | JWT | Get current user's per-chat opt-out status |
| /chats/:id/users/me | PATCH | JWT | Update opt-out preference |
| /chats/:id/messages | DELETE | JWT | Delete all chat messages (admin only) |
| /users/me/messages | DELETE | JWT | Delete current user's messages |
| /users/me/privacy | GET | JWT | Get global privacy settings |
| /users/me/privacy | PATCH | JWT | Update global opt-out |

## Privacy Model

- Chat admin enables summarization in Mini App → bot starts storing messages
- When storing: check `user.privacySettings.globallyOptedOut` first; if false, check `chat_to_user.optedOut` per chat
- If opted out: store record with `text = null, isHiddenForPrivacy = true`
- User can delete all their messages from Mini App → `DELETE FROM messages WHERE user_id = ?`
- Chat admin can delete all chat messages → `DELETE FROM messages WHERE chat_id = ?`
- New member joins chat → bot sends privacy notification (not implemented via message storage flow, it's a separate `chat_member` handler)

## Auth Flow

1. User opens Mini App in Telegram
2. `auth.tsx` reads `window.Telegram.WebApp.initData`
3. Sends `POST /api/auth/mini-app` with init data
4. Server validates init data against `BOT_TOKEN`, finds/creates user in DB
5. Server returns JWT containing `userId`
6. All subsequent API requests include `Authorization: Bearer <jwt>`
7. `jwtAuthMiddleware` verifies JWT, attaches `c.userId` to Hono context

## Omitted for MVP (schema exists, no subscription features)

- Balance/points/tariff system
- Rate limiting per tariff
- Admin panel for managing users/points
- Multi-language support

## Open Questions / Future

- **Dockerfile** needs to be updated from Bun to Node — use `node:22-alpine` or similar
- **Migrations** need to be run at startup — add a script or hook
- **PGlite persistence** — currently writes to `tmp/db` for dev and `/app/db` for production (Docker volume). This works for small scale. For larger scale, consider SQLite or external Postgres.
- **Schema migration** — delete the old `packages/frontend/db/drizzle/` migration folder. Run `drizzle-kit generate` from the new flattened schema to produce a single initial migration. Run `drizzle-kit migrate` on startup (via instrumentation or a script). Since there's no production data, we start fresh.
