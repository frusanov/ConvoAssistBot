# ConvoAssistBot

A Telegram bot with a Mini App UI for **voice transcription**, **conversation summaries**, and **user privacy controls**.

The bot transcribes voice/video messages via OpenAI Whisper, refines them with GPT-4.1-mini, and stores chat history for on-demand summarization. Users manage their privacy (opt-out, data deletion) through the embedded Mini App.

---

## Features

- **🎤 Voice & Video Transcription** — Transcribes voice messages and video notes using Whisper, then refines the result with GPT-4.1-mini for accuracy and optional summarization.
- **📝 Conversation Summaries** — `/summary [N]` command generates a GPT summary of the last N messages in the chat.
- **🔒 Privacy Controls** — Users can opt out of message storage per-chat or globally, and delete all their stored data — all from the Mini App.
- **⚙️ Admin Settings** — Chat admins toggle transcription/summarization and set message retention limits via the Mini App.
- **👋 New Member Notifications** — Automatically notifies new members about data storage and privacy options.
- **📱 Telegram Mini App** — Full settings UI embedded inside Telegram as a Mini App (no external login required).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (no Bun) |
| **Framework** | Next.js 16 (App Router) |
| **Bot** | Telegraf 4 |
| **Database** | PGlite (embeddable PostgreSQL) + Drizzle ORM |
| **API** | Hono (via Next.js route handlers) |
| **Auth** | Telegram Mini App init data validation + JWT (jose) |
| **AI** | OpenAI Whisper (transcription) + GPT-4.1-mini (refinement/summary) |
| **UI** | React 19, Tailwind CSS 4, Radix UI primitives |
| **Package Manager** | Yarn 4 |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js 16 Server                   │
│                                                      │
│  ┌─────────────┐    ┌──────────────────────────┐    │
│  │ Mini App UI  │    │     Hono API Routes      │    │
│  │ (React SPA)  │───▶│  /api/auth/*             │    │
│  │              │    │  /api/chats/*            │    │
│  │  Auth via    │    │  /api/privacy/*          │    │
│  │  initData    │    └──────────┬───────────────┘    │
│  └─────────────┘               │                     │
│                                 ▼                     │
│  ┌──────────────────────────────────────────┐        │
│  │              Drizzle ORM                  │        │
│  │         ┌──────────────────┐             │        │
│  │         │     PGlite DB     │            │        │
│  │         │  (PostgreSQL)     │            │        │
│  │         └──────────────────┘             │        │
│  └──────────────────────────────────────────┘        │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │         Telegram Bot (Telegraf)           │        │
│  │                                          │        │
│  │  Middleware pipeline (order matters):     │        │
│  │  1. ignoreOldMessages — skip stale msgs  │        │
│  │  2. contextCollector — DB lookups         │        │
│  │  3. command — parse bot commands          │        │
│  │  4. history — store messages for summary  │        │
│  │  5. transcribe — voice/video → text      │        │
│  │  6. summary — /summary command            │        │
│  └──────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │    Telegram       │
              │  (Bot API + Mini  │
              │   App WebView)    │
              └──────────────────┘
```

The bot starts via `instrumentation.ts` in the same Node.js process as the Next.js server. The Mini App is served as standard Next.js pages, authenticated via Telegram init data validation.

---

## Quick Start

### Prerequisites

- Node.js >= 22
- Yarn 4 (`corepack enable && corepack prepare yarn@4.12.0 --activate`)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- An OpenAI API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd convoassistbot
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your tokens:
#   BOT_TOKEN — from @BotFather
#   OPENAI_API_TOKEN — from OpenAI
#   ADMIN_USERS — comma-separated Telegram user IDs
#   ALLOWED_GROUPS — comma-separated Telegram group IDs

# Generate DB schema migration
yarn db:generate

# Run migrations (auto-runs on server start too)
yarn db:migrate
```

### Development

```bash
yarn dev
```

Starts Next.js dev server on port **3032**. The bot connects to Telegram automatically on startup.

### Production Build

```bash
yarn build
yarn start
```

### Docker

```bash
docker compose up --build
```

---

## Project Structure

```
convoassistbot/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Chat list (Mini App home)
│   ├── chats/[id]/page.tsx       # Chat settings page
│   └── api/[...path]/route.ts    # Hono API entrypoint
│       └── routes/
│           ├── auth.ts           # POST /auth/mini-app, POST /auth/oauth
│           ├── chats.ts          # CRUD for chats & settings
│           └── privacy.ts        # User privacy endpoints
│       └── middleware/
│           └── jwt-auth-middleware.ts  # JWT verification
│
├── bot/                          # Telegram bot
│   ├── index.ts                  # Telegraf setup, command handlers
│   ├── middleware/
│   │   ├── ignore-old-messages.ts   # Skip messages >60s old
│   │   ├── context-collector.ts     # DB user/chat lookup
│   │   ├── command.ts               # Parse bot commands
│   │   ├── history.ts               # Store messages (privacy-aware)
│   │   ├── transcribe.ts            # Voice/video → text
│   │   └── summary.ts               # /summary command handler
│   └── lib/
│       ├── openai.ts             # OpenAI client
│       ├── transcriber.ts        # Whisper API wrapper
│       └── refiner.ts            # GPT refinement prompt
│
├── db/                           # Database layer
│   ├── index.ts                  # PGlite + Drizzle setup
│   ├── schema/
│   │   ├── _common.ts            # Shared column helpers
│   │   ├── users.sql.ts          # users table
│   │   ├── chats.sql.ts          # chats + chat_to_user junction
│   │   └── messages.sql.ts       # messages table
│   ├── queries/
│   │   ├── users/                # User CRUD + privacy
│   │   ├── chats/                # Chat CRUD + settings + roles
│   │   └── messages/             # Message store/list/delete
│   └── drizzle/                  # Generated migrations
│
├── components/                   # React UI
│   ├── ui/                       # Primitive components (button, input, switch, etc.)
│   ├── providers/auth.tsx        # Mini App auth state machine
│   └── widgets/header.tsx        # App header with user avatar
│
├── api-sdk/                      # Frontend API client (axios)
│   ├── index.ts                  # API class with JWT interceptor
│   └── methods/
│       ├── auth.ts               # authMiniAPP, oauth
│       ├── chats.ts              # listChats, getChat, settings
│       └── privacy.ts            # getMyPrivacy, updateMyPrivacy, deleteMyMessages
│
├── types/                        # Shared TypeScript types
│   ├── api.ts                    # Response wrappers (WithMeta, WithPagination)
│   ├── chats.ts                  # ChatSetings interface
│   ├── db.ts                     # DB transaction type
│   └── telegram.ts               # Telegram chat type helpers
│
├── lib/                          # Frontend utilities
├── public/                       # Static assets
├── instrumentation.ts            # Bot startup + DB migrations
├── drizzle.config.ts             # Drizzle Kit config
├── next.config.ts                # Next.js config
└── Dockerfile                    # Node 22 + Yarn 4
```

---

## API Routes

All under `/api`, handled by Hono. Authenticated routes require `Authorization: Bearer <jwt>`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/mini-app` | Init data | Auth via Telegram Mini App init data |
| POST | `/auth/oauth` | OAuth | Auth via Telegram Login Widget |
| GET | `/chats` | JWT | List user's admin/creator chats |
| GET | `/chats/:id` | JWT | Get chat details and settings |
| PATCH | `/chats/:id/settings` | JWT+Admin | Update chat transcription/summarization settings |
| GET | `/chats/:id/users/me` | JWT | Get user's role and opt-out status for a chat |
| PATCH | `/chats/:id/users/me` | JWT | Toggle per-chat opt-out |
| DELETE | `/chats/:id/messages` | JWT+Admin | Delete all messages in a chat |
| GET | `/privacy/me` | JWT | Get global privacy settings |
| PATCH | `/privacy/me` | JWT | Update global opt-out |
| DELETE | `/privacy/me/messages` | JWT | Delete all of the user's messages |

---

## Privacy Model

1. **Opt-in by admin**: Chat admin enables summarization via Mini App → bot starts storing messages.
2. **Per-user control**: When storing a message, bot checks:
   - Global opt-out (`user.privacySettings.globallyOptedOut`) — if true, stores with `text: null, isHiddenForPrivacy: true`
   - Per-chat opt-out (`chat_to_user.optedOut`) — same treatment
3. **Data deletion**: Users can delete all their messages; admins can delete all chat messages.
4. **New member notifications**: When a user joins a chat with the bot, they receive a privacy notice and a link to settings.

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/summary [N]` | Summarize last N messages (default: 100). Requires summarization enabled in chat settings. |
| `/privacy` | Link to Mini App privacy settings |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | ✅ | Telegram bot token from @BotFather |
| `OPENAI_API_TOKEN` | ✅ | OpenAI API key for Whisper + GPT |
| `REPLICATE_API_TOKEN` | ✅ | Replicate API key (transcription fallback) |
| `DATABASE_URL` | ❌ | PGlite DB path (default: `./tmp/db`) |
| `ADMIN_USERS` | ❌ | Comma-separated Telegram user IDs for admin access |
| `ALLOWED_GROUPS` | ❌ | Comma-separated Telegram group IDs where bot operates |

---

## License

Security Audit Source Available License (SASAL) v1.0 — see [LICENSE.md](./LICENSE.md).  
Source is published for independent security audits and personal non-commercial use.
Commercial use requires prior written permission.
