# ConvoAssistBot — Monolithic MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the abandoned monorepo into a single Next.js app running a Telegram bot with Mini App UI for voice transcription, conversation summaries, and user privacy controls.

**Architecture:** Single Next.js app (App Router) on Node.js + Yarn. Telegram bot starts via `instrumentation.ts`. PGlite + Drizzle for DB. Hono for API routes. OpenAI Whisper + GPT-4.1-mini for AI. Mini App auth via Telegram init data + JWT.

**Tech Stack:** Node.js, Yarn 4, Next.js 16, Telegraf 4, PGlite, Drizzle ORM, Hono, OpenAI, React 19, Tailwind CSS 4

## Global Constraints

- No Bun — use Node.js + Yarn 4
- No subscription/balance/tariff features until post-MVP
- Bot middleware order: ignoreOldMessages → contextCollector → command → history → transcribe → summary
- All user-facing settings configurable via Mini App, not Telegram inline menus
- PGlite DB path: `tmp/db` (dev), `/app/db` (Docker)
- JWT secret: hardcoded until post-MVP (`zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI`)
- Tokens in `.env` are already committed — do not commit new `.env` changes

---
### Task 1: Flatten Monorepo

**Files:**
- Delete: `packages/bot/` entirely
- Delete: `bun.lock` (root)
- Delete: `packages/frontend/` directory structure (move contents, not just delete)
- Move: `packages/frontend/*` → root (all files and folders)
- Modify: `package.json` (root — rewrite as single package from packages/frontend/package.json)
- Modify: `Dockerfile` (rewrite for Node, not Bun)
- Modify: `compose.yaml` (update Dockerfile reference if needed)
- Keep: `build.sh`, `entrypoint.sh`, `.env`, `.env.example`, `.dockerignore`, `.gitignore`, `.yarn/`, `.yarnrc.yml`

**Interfaces:**
- Consumes: existing file structure
- Produces: flattened monorepo where `yarn install` and `yarn dev` work from root

- [ ] **Step 1: Copy all packages/frontend subdirectories to root**

```bash
cd /home/frusanov/Desktop/ConvoAssistBot

# Move directories up
for dir in app components api-sdk bot db types lib public; do
  cp -r packages/frontend/$dir ./$dir
done

# Move config files up
cp packages/frontend/package.json ./package-new.json
cp packages/frontend/tsconfig.json ./tsconfig-new.json
cp packages/frontend/drizzle.config.ts ./drizzle.config.ts
cp packages/frontend/next.config.ts ./next.config.ts
cp packages/frontend/postcss.config.mjs ./postcss.config.mjs
cp packages/frontend/eslint.config.mjs ./eslint.config.mjs
cp packages/frontend/instrumentation.ts ./instrumentation.ts
cp packages/frontend/next-env.d.ts ./next-env.d.ts
```

- [ ] **Step 2: Rewrite root package.json as single package**

Replace root `package.json` with the content of `packages/frontend/package.json`, adapting it:

```json
{
  "name": "convoassistbot",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "cross-env PORT=3032 next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@electric-sql/pglite": "^0.3.14",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@tma.js/init-data-node": "^2.0.4",
    "@types/telegram-web-app": "^9.1.1",
    "axios": "^1.13.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "drizzle-kit": "^0.31.8",
    "drizzle-orm": "^0.45.0",
    "hono": "^4.10.7",
    "jose": "^6.1.3",
    "lucide-react": "^0.555.0",
    "next": "16.0.7",
    "openai": "^5.6.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "react-hook-form": "^7.69.0",
    "tailwind-merge": "^3.4.0",
    "telegraf": "^4.16.3",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "cross-env": "^10.1.0",
    "eslint": "^9",
    "eslint-config-next": "16.0.7",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

Key changes from original frontend package.json:
- Added `date-fns`, `drizzle-kit`, `openai`, `telegraf` (needed from bot)
- Added `db:generate` and `db:migrate` scripts
- Removed workspace config

- [ ] **Step 3: Update tsconfig**

Move `packages/frontend/tsconfig.json` to root, update paths:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 4: Delete old artifacts**

```bash
rm -rf packages
rm bun.lock
rm -rf node_modules
```

- [ ] **Step 5: Rewrite Dockerfile for Node**

```dockerfile
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare yarn@4.12.0 --activate

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ ./.yarn/

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.yarn ./.yarn
COPY --from=base /app/entrypoint.sh ./

EXPOSE 3032

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["yarn", "start"]
```

- [ ] **Step 6: Update compose.yaml if needed** (check Dockerfile path is correct)

- [ ] **Step 7: Install dependencies and verify**

```bash
yarn install
yarn dev
```

Expected: Next.js dev server starts on port 3032, no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: flatten monorepo — single Next.js app at root"
```

---

### Task 2: Simplify Database Schema

**Files:**
- Modify: `db/schema/users.sql.ts` — remove balanceId, add firstName/lastName/username/privacySettings
- Modify: `db/schema/chats.sql.ts` — remove balanceId
- Modify: `db/schema/messages.sql.ts` — add chatTgId, userTgId, originalCreatedAt; remove messageToChatJunctionTable
- Modify: `db/schema/balance.sql.ts` — delete entirely
- Modify: `db/queries/balance/index.ts` — delete entirely
- Modify: `db/queries/index.ts` — remove balance export
- Modify: `db/schema/_common.ts` — keep as-is
- Delete: `db/drizzle/` — remove old migration folder entirely
- Create: new initial migration via `drizzle-kit generate`

**Interfaces:**
- Consumes: Task 1 file structure
- Produces: clean schema with chats, users, messages, chat_to_user tables. Initial migration ready.

- [ ] **Step 1: Rewrite `db/schema/users.sql.ts`**

```typescript
import { boolean, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { essentialsWithTgId } from "./_common";

export interface UserPrivacySettings {
  globallyOptedOut: boolean;
}

export const usersTable = pgTable("users", {
  ...essentialsWithTgId(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text(),
  privacySettings: jsonb()
    .default({ globallyOptedOut: false } satisfies UserPrivacySettings)
    .notNull()
    .$type<UserPrivacySettings>(),
});
```

- [ ] **Step 2: Rewrite `db/schema/chats.sql.ts`**

```typescript
import { jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { essentials, essentialsWithTgId } from "./_common";
import { usersTable } from "./users.sql";
import { ChatSetings } from "@/types/chats";

export const chatTypeEnum = pgEnum("type", ["group", "private"]);

export const chatsTable = pgTable("chats", {
  ...essentialsWithTgId(),
  title: text(),
  type: chatTypeEnum().notNull(),
  settings: jsonb()
    .default({
      transcribe: false,
      summarize: false,
      storeMessages: {
        amount: 1000,
        time: 604800,
      },
    })
    .notNull()
    .$type<ChatSetings>(),
});

export const chatUserRoleEnum = pgEnum("chat_user_role", [
  "member",
  "administrator",
  "creator",
]);

export const chatToUserJunctionTable = pgTable(
  "chat_to_user",
  {
    ...essentials(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chatsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: chatUserRoleEnum().notNull(),
    optedOut: boolean("opted_out").notNull().default(false),
  },
  (table) => [unique("chat_user_unique").on(table.chatId, table.userId)],
);
```

- [ ] **Step 3: Rewrite `db/schema/messages.sql.ts`**

```typescript
import { boolean, bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { essentialsWithTgId } from "./_common";
import { chatsTable } from "./chats.sql";
import { usersTable } from "./users.sql";

export const messagesTable = pgTable("messages", {
  ...essentialsWithTgId(),
  text: text(),
  isHiddenForPrivacy: boolean("is_hidden_for_privacy").notNull().default(false),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chatsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  chatTgId: bigint("chat_tg_id", { mode: "number" }).notNull(),
  userTgId: bigint("user_tg_id", { mode: "number" }),
  originalCreatedAt: timestamp("original_created_at", { mode: "date" }).notNull(),
});
```

- [ ] **Step 4: Delete `db/schema/balance.sql.ts` and `db/queries/balance/`**

```bash
rm db/schema/balance.sql.ts
rm -rf db/queries/balance
```

- [ ] **Step 5: Update `db/queries/index.ts`**

```typescript
export * from "./chats";
export * from "./users";
```

- [ ] **Step 6: Delete old migrations and generate fresh one**

```bash
rm -rf db/drizzle
npx drizzle-kit generate
```

Expected: `db/drizzle/` recreated with a single initial migration containing all three tables.

- [ ] **Step 7: Verify schema compiles**

```bash
npx tsc --noEmit
```

Expected: No schema-related errors. (May have errors from other files that depend on balance — those will be fixed in subsequent tasks.)

- [ ] **Step 8: Commit**

```bash
git add db/
git commit -m "feat: simplify schema — remove balance, add privacy fields"
```

---

### Task 3: Update DB Queries

**Files:**
- Modify: `db/queries/users/find-or-create-user.ts` — add firstName/lastName/username fields, no balanceId
- Create: `db/queries/users/update-privacy-settings.ts`
- Create: `db/queries/users/find-by-tg-id.ts`
- Modify: `db/queries/users/index.ts` — export new queries
- Modify: `db/queries/chats/find-or-create-chat.ts` — no balanceId
- Create: `db/queries/chats/update-settings.ts`
- Create: `db/queries/chats/get-user-role.ts`
- Modify: `db/queries/chats/index.ts` — export new queries
- Create: `db/queries/messages/index.ts`
- Create: `db/queries/messages/store-message.ts`
- Create: `db/queries/messages/list-by-chat.ts`
- Create: `db/queries/messages/delete-by-user.ts`
- Create: `db/queries/messages/delete-by-chat.ts`

**Interfaces:**
- Consumes: Task 2 schema
- Produces: all query functions needed by bot and API

- [ ] **Step 1: Rewrite `db/queries/users/find-or-create-user.ts`**

```typescript
import { db } from "@/db";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";
import type { User } from "telegraf/types";

export async function findOrCreateUser(tgUser: User) {
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tgId, tgUser.id));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        tgId: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
      })
      .returning();
  }

  return user;
}
```

- [ ] **Step 2: Create `db/queries/users/update-privacy-settings.ts`**

```typescript
import { db } from "@/db";
import { usersTable, UserPrivacySettings } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";

export async function updatePrivacySettings(
  userId: string,
  settings: Partial<UserPrivacySettings>,
) {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .then((r) => r[0]);

  if (!user) throw new Error("User not found");

  const merged = { ...(user.privacySettings as UserPrivacySettings), ...settings };

  return await db
    .update(usersTable)
    .set({ privacySettings: merged })
    .where(eq(usersTable.id, userId))
    .returning()
    .then((r) => r[0]);
}
```

- [ ] **Step 3: Create `db/queries/users/find-by-tg-id.ts`**

```typescript
import { db } from "@/db";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";

export async function findByTgId(tgId: number) {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tgId, tgId))
    .then((r) => r[0] ?? null);
}
```

- [ ] **Step 3b: Create `db/queries/users/find-by-id.ts`**

```typescript
import { db } from "@/db";
import { usersTable } from "@/db/schema/users.sql";
import { eq } from "drizzle-orm";

export async function findById(id: string) {
  return await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .then((r) => r[0] ?? null);
}
```

- [ ] **Step 4: Update `db/queries/users/index.ts`**

```typescript
import { findOrCreateUser } from "./find-or-create-user";
import { updatePrivacySettings } from "./update-privacy-settings";
import { findByTgId } from "./find-by-tg-id";

export const userQueries = {
  findOrCreateUser,
  updatePrivacySettings,
  findByTgId,
  findById,
};
```

- [ ] **Step 5: Rewrite `db/queries/chats/find-or-create-chat.ts`**

```typescript
import { db } from "@/db";
import { chatsTable } from "@/db/schema/chats.sql";
import { eq } from "drizzle-orm";
import type { Chat } from "telegraf/types";

export async function findOrCreateChat(tgChat: Chat) {
  let [chat] = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.tgId, tgChat.id));

  if (!chat) {
    [chat] = await db
      .insert(chatsTable)
      .values({
        tgId: tgChat.id,
        title: "title" in tgChat ? tgChat.title : null,
        type: tgChat.type === "group" || tgChat.type === "supergroup" ? "group" : "private",
      })
      .returning();
  }

  return chat;
}
```

- [ ] **Step 6: Create `db/queries/chats/update-settings.ts`**

```typescript
import { db } from "@/db";
import { chatsTable } from "@/db/schema/chats.sql";
import { eq } from "drizzle-orm";
import { ChatSetings } from "@/types/chats";

export async function updateChatSettings(chatId: string, settings: Partial<ChatSetings>) {
  const chat = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.id, chatId))
    .then((r) => r[0]);

  if (!chat) throw new Error("Chat not found");

  const merged = { ...(chat.settings as ChatSetings), ...settings };

  return await db
    .update(chatsTable)
    .set({ settings: merged })
    .where(eq(chatsTable.id, chatId))
    .returning()
    .then((r) => r[0]);
}
```

- [ ] **Step 7: Create `db/queries/chats/get-user-role.ts`**

```typescript
import { db } from "@/db";
import { chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { and, eq } from "drizzle-orm";

export async function getUserRole(chatId: string, userId: string) {
  const [row] = await db
    .select()
    .from(chatToUserJunctionTable)
    .where(
      and(
        eq(chatToUserJunctionTable.chatId, chatId),
        eq(chatToUserJunctionTable.userId, userId),
      ),
    );

  return row?.role ?? null;
}
```

- [ ] **Step 8: Update `db/queries/chats/index.ts`**

```typescript
import { findOrCreateChat } from "./find-or-create-chat";
import { updateChatSettings } from "./update-settings";
import { isUserAdmin } from "./is-user-admin";
import { getUserRole } from "./get-user-role";
import { updateChatMeta } from "./update-chat-meta";
import { createOrUpdateChatUser } from "./create-or-update-chat-user";

export const chatQueries = {
  findOrCreateChat,
  updateChatSettings,
  isUserAdmin,
  getUserRole,
  updateChatMeta,
  createOrUpdateChatUser,
};
```

- [ ] **Step 9: Create `db/queries/messages/store-message.ts`**

```typescript
import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { fromUnixTime } from "date-fns";
import type { Message } from "telegraf/types";

interface StoreMessageParams {
  tgMessage: Message.TextMessage;
  chatId: string;
  userId: string;
  chatTgId: number;
  userTgId: number | null;
  isHiddenForPrivacy?: boolean;
}

export async function storeMessage(params: StoreMessageParams) {
  return await db
    .insert(messagesTable)
    .values({
      tgId: params.tgMessage.message_id,
      chatId: params.chatId,
      userId: params.userId,
      chatTgId: params.chatTgId,
      userTgId: params.userTgId,
      text: params.isHiddenForPrivacy ? null : params.tgMessage.text,
      isHiddenForPrivacy: params.isHiddenForPrivacy ?? false,
      originalCreatedAt: fromUnixTime(params.tgMessage.date),
    })
    .returning()
    .then((r) => r[0]);
}
```

- [ ] **Step 10: Create `db/queries/messages/list-by-chat.ts`**

```typescript
import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { eq, desc } from "drizzle-orm";

export async function listMessagesByChat(chatId: string, limit: number = 100) {
  return await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatId, chatId))
    .orderBy(desc(messagesTable.originalCreatedAt))
    .limit(limit);
}
```

- [ ] **Step 11: Create `db/queries/messages/delete-by-user.ts`**

```typescript
import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { eq } from "drizzle-orm";

export async function deleteMessagesByUser(userId: string) {
  return await db
    .delete(messagesTable)
    .where(eq(messagesTable.userId, userId));
}
```

- [ ] **Step 12: Create `db/queries/messages/delete-by-chat.ts`**

```typescript
import { db } from "@/db";
import { messagesTable } from "@/db/schema/messages.sql";
import { eq } from "drizzle-orm";

export async function deleteMessagesByChat(chatId: string) {
  return await db
    .delete(messagesTable)
    .where(eq(messagesTable.chatId, chatId));
}
```

- [ ] **Step 13: Create `db/queries/messages/index.ts`**

```typescript
import { storeMessage } from "./store-message";
import { listMessagesByChat } from "./list-by-chat";
import { deleteMessagesByUser } from "./delete-by-user";
import { deleteMessagesByChat } from "./delete-by-chat";

export const messageQueries = {
  storeMessage,
  listMessagesByChat,
  deleteMessagesByUser,
  deleteMessagesByChat,
};
```

- [ ] **Step 14: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 15: Commit**

```bash
git add db/queries/
git commit -m "feat: add message queries and update user/chat queries for simplified schema"
```

---

### Task 4: Port Bot Core Libraries

**Files:**
- Create: `bot/lib/openai.ts` — port from `packages/bot/lib/shared/openai.ts`
- Create: `bot/lib/transcriber.ts` — port from `packages/bot/lib/transcriber.ts`
- Create: `bot/lib/refiner.ts` — port from `packages/bot/lib/refiner.ts`

**Interfaces:**
- Consumes: `process.env.OPENAI_API_TOKEN`
- Produces: `transcriber(url: string) => { transcription: string }`, `refiner(input: string) => Promise<string>`

- [ ] **Step 1: Create `bot/lib/openai.ts`**

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_TOKEN,
});
```

- [ ] **Step 2: Create `bot/lib/transcriber.ts`**

```typescript
import { openai } from "./openai";

export async function transcriber(url: string) {
  const file = await fetch(url, {
    method: "GET",
  }).then(async (res) => {
    const blob = await res.blob();
    const mimeType = res.headers.get("content-type");
    return new File([blob], "audio.mp4", { type: mimeType || undefined });
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return {
    transcription: transcription.text,
  };
}
```

- [ ] **Step 3: Create `bot/lib/refiner.ts`**

```typescript
import { openai } from "./openai";

const systemPrompt = `
  You are an Assistant who's job is refine texts received from speech-to-text model. This tts model sometimes makes mistakes in cases where different words sound similar or it can transcribe single complex word as separate simpler words.

  You answer may consist of two sections: TRANSCRIPTION and SUMMARY.

  TRANSCRIPTION - is required section. Here you must provide corrected text.

  SUMMARY - is optional section. Here you can provide short summary of corrected result. Summary must be in same language as original and from the same perspective. Summary MUST be more concise than the original transcription.

  DO NOT use markdown formatting for output.
  DO NOT provide summary for small sentence and phrases.

  EXAMPLE:

  \`\`\`
    TRANSCRIPTION:
    Hey, just saw this quick little brown fox leap right over a lazy dog lying on the ground. The dog didn't even care—just stayed there like nothing happened. The fox was gone in a flash. Kinda funny, actually.

    SUMMARY:
    The quick brown fox jumps over the lazy dog.
  \`\`\`
`;

export async function refiner(input: string): Promise<string> {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input },
    ],
    model: "gpt-4.1-mini",
    stream: false,
    temperature: 0.75,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const result = chatCompletion.choices[0].message.content;
  if (!result) throw new Error("No result from OpenAI");

  const transcriptionHeader = "TRANSCRIPTION:";
  const summaryHeader = "SUMMARY:";

  const transcriptionIndex = result.indexOf(transcriptionHeader);
  const summaryIndex = result.indexOf(summaryHeader);

  const transcription = result
    .slice(
      transcriptionIndex + transcriptionHeader.length,
      summaryIndex === -1 ? undefined : summaryIndex,
    )
    .trim();

  let summary = "";

  if (summaryIndex !== -1) {
    summary = result.slice(summaryIndex + summaryHeader.length).trim();
  }

  return `${summary ? `Summary:\n\n${summary}\n\n` : ""}Transcription:\n\n${transcription}`;
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add bot/lib/
git commit -m "feat: port bot libraries (openai, transcriber, refiner)"
```

---

### Task 5: Port and Rewrite Bot Middleware

**Files:**
- Modify: `bot/middleware/context-collector.ts` — extend to return full user+chat data, add privacy check helpers, expose ctx.systems interface
- Modify: `bot/middleware/ignore-old-messages.ts` — keep as-is
- Create: `bot/middleware/command.ts` — port from packages/bot
- Create: `bot/middleware/history.ts` — port and adapt to new schema + privacy model
- Create: `bot/middleware/transcribe.ts` — port from packages/bot
- Create: `bot/middleware/summary.ts` — port from packages/bot
- Modify: `bot/index.ts` — wire all middleware in correct order

**Interfaces:**
- Consumes: `db/queries/*`, `bot/lib/*`
- Produces: working bot middleware pipeline

- [ ] **Step 1: Rewrite `bot/middleware/context-collector.ts`**

```typescript
import { chatQueries, userQueries } from "@/db/queries";
import type { Context, MiddlewareFn } from "telegraf";

declare module "telegraf" {
  interface Context {
    userData: Awaited<ReturnType<typeof userQueries.findOrCreateUser>>;
    chatData: Awaited<ReturnType<typeof chatQueries.findOrCreateChat>>;
    systems: {
      command: { name: string; args: string[] } | null;
    };
  }
}

export const contextCollectorMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const tgUser = ctx.message?.from || ctx.callbackQuery?.from;
  const tgChat = ctx.chat;

  if (!tgUser) throw new Error("User not provided");
  if (!tgChat) throw new Error("Chat not provided");

  const [user, chat] = await Promise.all([
    userQueries.findOrCreateUser(tgUser),
    chatQueries.findOrCreateChat(tgChat),
  ]);

  ctx.userData = user;
  ctx.chatData = chat;
  ctx.systems = { command: null };

  return next();
};
```

- [ ] **Step 2: Create `bot/middleware/command.ts`**

```typescript
import type { Context, MiddlewareFn } from "telegraf";
import { message } from "telegraf/filters";

export const commandMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  ctx.systems.command = null;

  const commands = ctx.entities("bot_command");
  const command = commands[0];

  if (!command || !ctx.has(message("text"))) return await next();

  const args = ctx.message.text
    .slice(command.offset + command.length)
    .split(" ")
    .map((arg) => arg.trim())
    .filter(Boolean);

  ctx.systems.command = {
    name: command.fragment.slice(1),
    args,
  };

  await next();
};
```

- [ ] **Step 3: Create `bot/middleware/history.ts`**

```typescript
import type { Context, MiddlewareFn } from "telegraf";
import { message, editedMessage } from "telegraf/filters";
import { messageQueries } from "@/db/queries/messages";
import { chatToUserJunctionTable } from "@/db/schema/chats.sql";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { UserPrivacySettings } from "@/db/schema/users.sql";

export const historyMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const chat = ctx.chatData;
  const user = ctx.userData;
  const chatSettings = chat.settings as { summarize?: boolean; storeMessages?: { amount: number; time: number } };

  if (!chatSettings.summarize) return await next();

  if (ctx.has(message("text")) && !ctx.systems.command) {
    // Check global opt-out
    const privacy = user.privacySettings as UserPrivacySettings;
    if (privacy.globallyOptedOut) {
      // Store without content
      await messageQueries.storeMessage({
        tgMessage: ctx.message,
        chatId: chat.id,
        userId: user.id,
        chatTgId: chat.tgId,
        userTgId: ctx.message.from?.id ?? null,
        isHiddenForPrivacy: true,
      });
      return await next();
    }

    // Check per-chat opt-out
    const [junction] = await db
      .select()
      .from(chatToUserJunctionTable)
      .where(
        and(
          eq(chatToUserJunctionTable.chatId, chat.id),
          eq(chatToUserJunctionTable.userId, user.id),
        ),
      );

    const isOptedOut = junction?.optedOut ?? false;

    await messageQueries.storeMessage({
      tgMessage: ctx.message,
      chatId: chat.id,
      userId: user.id,
      chatTgId: chat.tgId,
      userTgId: ctx.message.from?.id ?? null,
      isHiddenForPrivacy: isOptedOut,
    });
  }

  await next();
};
```

- [ ] **Step 4: Create `bot/middleware/transcribe.ts`**

```typescript
import type { Context, MiddlewareFn } from "telegraf";
import { message } from "telegraf/filters";
import { transcriber } from "../lib/transcriber";
import { refiner } from "../lib/refiner";
import { messageQueries } from "@/db/queries/messages";

export const transcribeMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  const isVoice = ctx.has(message("voice"));
  const isVideoNote = ctx.has(message("video_note"));

  if (!isVoice && !isVideoNote) return await next();

  const fileId = isVoice ? ctx.message.voice.file_id : ctx.message.video_note.file_id;
  const type = isVoice ? "voice" : "video_note";

  const reply = await ctx.reply(
    `Transcribing ${type === "voice" ? "voice message" : "video note"}...`,
    { reply_parameters: { message_id: ctx.message.message_id } },
  );

  const url = await ctx.telegram.getFileLink(fileId);
  const result = await transcriber(url.href);

  const draftMessage = await ctx.telegram.editMessageText(
    reply.chat.id,
    reply.message_id,
    undefined,
    result.transcription,
  );

  // Store in history if summarize is enabled
  const chatSettings = ctx.chatData.settings as { summarize?: boolean };
  if (chatSettings.summarize && typeof draftMessage !== "boolean") {
    const fakeTextMessage = {
      ...ctx.message,
      text: `Transcribed from ${type === "voice" ? "voice message" : "video note"}:\n${result.transcription}`,
    } as any;
    await messageQueries.storeMessage({
      tgMessage: fakeTextMessage,
      chatId: ctx.chatData.id,
      userId: ctx.userData.id,
      chatTgId: ctx.chatData.tgId,
      userTgId: ctx.message.from?.id ?? null,
    });
  }

  // Refine the transcription
  const refined = await refiner(result.transcription);

  const transcriptionHeader = "Transcription:";
  const summaryHeader = "Summary:";

  const transcriptionIndex = refined.indexOf(transcriptionHeader);
  const summaryIndex = refined.indexOf(summaryHeader);

  const transcriptionHeaderEntities = [
    { type: "bold" as const, offset: transcriptionIndex, length: transcriptionHeader.length },
    { type: "underline" as const, offset: transcriptionIndex, length: transcriptionHeader.length },
  ];

  const summaryHeaderEntities = summaryIndex !== -1
    ? [
        { type: "bold" as const, offset: summaryIndex, length: summaryHeader.length },
        { type: "underline" as const, offset: summaryIndex, length: summaryHeader.length },
      ]
    : [];

  await ctx.telegram.editMessageText(
    reply.chat.id,
    reply.message_id,
    undefined,
    refined,
    { entities: [...transcriptionHeaderEntities, ...summaryHeaderEntities] },
  );

  await next();
};
```

- [ ] **Step 5: Create `bot/middleware/summary.ts`**

```typescript
import type { Context, MiddlewareFn } from "telegraf";
import { messageQueries } from "@/db/queries/messages";
import { openai } from "../lib/openai";

export const summaryMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (ctx.systems.command?.name !== "summary") return await next();

  const chatSettings = ctx.chatData.settings as { summarize?: boolean };
  if (!chatSettings.summarize) {
    await ctx.reply("Summarization is not enabled for this chat. Ask an admin to enable it in settings.");
    return;
  }

  const args = ctx.systems.command.args;
  const limit = parseInt(args[0]) || 100;

  const messages = await messageQueries.listMessagesByChat(ctx.chatData.id, limit);

  // Filter out hidden messages
  const visibleMessages = messages.filter((m) => !m.isHiddenForPrivacy);

  if (visibleMessages.length === 0) {
    await ctx.reply("No messages to summarize.");
    return;
  }

  const messagesString = visibleMessages
    .map((msg) => {
      return `Message: ${msg.text}`;
    })
    .join("\n\n- - -\n\n");

  const statusMsg = await ctx.reply("Summarizing...", {
    reply_parameters: { message_id: ctx.message.message_id },
  });

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Please summarize the received list of messages. Summary must be in the same language as the majority of the messages. Output only the summary.`,
        },
        { role: "user", content: messagesString },
      ],
      model: "gpt-4.1-mini",
      stream: false,
      temperature: 0.75,
    });

    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      statusMsg.message_id,
      undefined,
      chatCompletion.choices[0].message.content || "",
    );
  } catch {
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      statusMsg.message_id,
      undefined,
      "Error occurred while summarizing messages.",
    );
  }

  await next();
};
```

- [ ] **Step 6: Rewrite `bot/index.ts`**

```typescript
import { Telegraf } from "telegraf";
import { ignoreOldMessagesMiddleware } from "./middleware/ignore-old-messages";
import { contextCollectorMiddleware } from "./middleware/context-collector";
import { commandMiddleware } from "./middleware/command";
import { historyMiddleware } from "./middleware/history";
import { transcribeMiddleware } from "./middleware/transcribe";
import { summaryMiddleware } from "./middleware/summary";

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN must be provided!");

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(ignoreOldMessagesMiddleware);
bot.use(contextCollectorMiddleware);
bot.use(commandMiddleware);
bot.use(historyMiddleware);
bot.use(transcribeMiddleware);
bot.use(summaryMiddleware);

bot.start((ctx) => ctx.reply("well cum"));

// /privacy command — link to Mini App
bot.command("privacy", async (ctx) => {
  await ctx.reply(
    `🔒 **Privacy Settings**\n\n` +
    `You can control your privacy here: https://t.me/ConvoAssistTestBot/app\n\n` +
    `Options: opt out per chat, opt out globally, delete your data.`,
    { parse_mode: "Markdown" },
  );
});

// New member notification
bot.on("chat_member", async (ctx) => {
  const update = ctx.update as any;
  const newMember = update.chat_member?.new_chat_member?.user;
  const status = update.chat_member?.new_chat_member?.status;

  if (newMember && status === "member") {
    await ctx.reply(
      `👋 Welcome! This bot stores messages to generate summaries. ` +
      `You can opt out anytime in settings: https://t.me/ConvoAssistTestBot/app`,
    );
  }
});
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add bot/
git commit -m "feat: port and rewrite bot middleware with privacy model"
```

---

### Task 6: Wire Bot Startup in Instrumentation

**Files:**
- Modify: `instrumentation.ts` — add bot.launch() on Node.js runtime

**Interfaces:**
- Consumes: `bot/index.ts`
- Produces: bot starts when Next.js server starts

- [ ] **Step 1: Rewrite `instrumentation.ts`**

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bot } = await import("./bot");
    bot.launch();
  }
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add instrumentation.ts
git commit -m "feat: start bot via instrumentation.ts"
```

---

### Task 7: Fix Mini App Auth and Wire Settings UI

**Files:**
- Modify: `components/providers/auth.tsx` — fix state machine so it transitions past Init
- Modify: `app/page.tsx` — ensure it works with fixed auth
- Modify: `app/chats/[id]/page.tsx` — wire to real API for settings + privacy toggles
- Create: `app/api/[...path]/routes/privacy.ts` — NEW route for user privacy settings
- Modify: `app/api/[...path]/route.ts` — register new route
- Modify: `app/api/[...path]/routes/chats.ts` — add settings PATCH, add user opt-out PATCH, add message DELETE
- Modify: `api-sdk/methods/chats.ts` — add new methods
- Create: `api-sdk/methods/privacy.ts` — NEW
- Modify: `api-sdk/index.ts` — export new methods

**Interfaces:**
- Consumes: `db/queries/*`, Task 2 schema
- Produces: working Mini App auth + chat settings page + privacy controls

- [ ] **Step 1: Fix `components/providers/auth.tsx` state machine**

The current bug is that `authStage` starts at `AuthStages.Init (0)` and the component always renders the "Trying to get auth" fallback because nothing sets it to a later stage. Fix:

```typescript
"use client";

// ... imports same as before ...

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [context, setContext] = useState<AuthContextPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const script = document.querySelector(
      'script[src^="https://telegram.org/js/telegram-web-app.js"]',
    ) as HTMLScriptElement;

    const handleLoad = () => {
      if (window.Telegram?.WebApp?.initData) {
        setContext({
          user: window.Telegram.WebApp.initDataUnsafe.user as WebAppUser,
          initData: window.Telegram.WebApp.initData,
          initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
        });
      } else {
        // No Telegram context — try OAuth as fallback
        setIsLoading(false);
      }
    };

    if (script) {
      script.addEventListener("load", handleLoad);
    } else {
      handleLoad();
    }

    return () => script?.removeEventListener("load", handleLoad);
  }, []);

  useEffect(() => {
    if (!context) return;

    api.authMiniAPP(context.initData).then(({ token }) => {
      setToken(token);
      setIsLoading(false);
    });
  }, [context]);

  // Telegram Login Widget handler (for non-Mini-App environments)
  useEffect(() => {
    (window as any).onTelegramAuth = (user: any) => {
      api.oauth(user).then(({ token }) => {
        setToken(token);
        setContext({ user, initData: "", initDataUnsafe: {} as any });
        setIsLoading(false);
      });
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!token) {
    // Fallback: show Telegram Login Widget
    return (
      <>
        <Script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login="ConvoAssistTestBot"
          data-size="medium"
          data-userpic="false"
          data-onauth="onTelegramAuth(user)"
          data-request-access="write"
        />
        <div className="flex items-center justify-center min-h-screen">Sign in with Telegram</div>
      </>
    );
  }

  return (
    <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
  );
};
```

- [ ] **Step 2: Create `app/api/[...path]/routes/privacy.ts`**

```typescript
import { Hono } from "hono";
import { jwtAuthMiddleware } from "../middleware/jwt-auth-middleware";
import { userQueries } from "@/db/queries";
import { messageQueries } from "@/db/queries/messages";

export const privacy = new Hono();

privacy.use(jwtAuthMiddleware);

// Get my privacy settings
privacy.get("/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");
  const user = await userQueries.findById(c.userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ data: user.privacySettings });
});

// Update global opt-out
privacy.patch("/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");
  const body = await c.req.json();
  const updated = await userQueries.updatePrivacySettings(c.userId, body);
  return c.json({ data: updated?.privacySettings });
});

// Delete all my messages
privacy.delete("/me/messages", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");
  await messageQueries.deleteMessagesByUser(c.userId);
  return c.json({ success: true });
});
```

- [ ] **Step 3: Update `app/api/[...path]/route.ts` to register privacy routes**

```typescript
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { chats } from "./routes/chats";
import { auth } from "./routes/auth";
import { privacy } from "./routes/privacy";

const app = new Hono().basePath("/api");

app.route("/auth", auth);
app.route("/chats", chats);
app.route("/privacy", privacy);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
```

- [ ] **Step 4: Update `app/api/[...path]/routes/chats.ts`**

Add these endpoints to the existing `chats` Hono app (after the existing routes, before the export):

```typescript
// PATCH /chats/:id/settings — update chat settings (admin only)
chats.patch("/:id/settings", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const role = await chatQueries.getUserRole(c.req.param("id"), c.userId);
  if (role !== "administrator" && role !== "creator") {
    return c.json({ error: "Admin access required" }, 403);
  }

  const body = await c.req.json();
  const updated = await chatQueries.updateChatSettings(c.req.param("id"), body);
  return c.json({ data: updated.settings });
});

// GET /chats/:id/users/me — get user's per-chat opt-out status
chats.get("/:id/users/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");
  const row = await chatQueries.getUserRole(c.req.param("id"), c.userId);
  return c.json({ data: { role: row, optedOut: false } });
  // Note: optedOut stored on chat_to_user junction, get full junction row
});

// PATCH /chats/:id/users/me — toggle opt-out
chats.patch("/:id/users/me", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");
  const body = await c.req.json();
  // Update optedOut on chat_to_user junction for this user+chat
  const { db } = await import("@/db");
  const { chatToUserJunctionTable } = await import("@/db/schema/chats.sql");
  const { and, eq } = await import("drizzle-orm");

  await db
    .update(chatToUserJunctionTable)
    .set({ optedOut: body.optedOut })
    .where(
      and(
        eq(chatToUserJunctionTable.chatId, c.req.param("id")),
        eq(chatToUserJunctionTable.userId, c.userId),
      ),
    );

  return c.json({ success: true });
});

// DELETE /chats/:id/messages — delete all chat messages (admin only)
chats.delete("/:id/messages", async (c) => {
  if (!c.userId) throw new Error("Unauthorized");

  const role = await chatQueries.getUserRole(c.req.param("id"), c.userId);
  if (role !== "administrator" && role !== "creator") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await messageQueries.deleteMessagesByChat(c.req.param("id"));
  return c.json({ success: true });
});
```

- [ ] **Step 5: Update `api-sdk/methods/chats.ts` and `api-sdk/index.ts`**

Add methods: `updateChatSettings`, `getMyPrivacy`, `updateMyPrivacy`, `deleteMyMessages`, `deleteChatMessages`.

- [ ] **Step 6: Wire `app/chats/[id]/page.tsx` to real data**

The page currently uses `defaultValues: async () => api.getChat(id).then(r => r.data.settings)` but doesn't store changes. Wire the form submit to `api.updateChatSettings(id, values)` and add a privacy opt-out toggle section.

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add components/ app/ api-sdk/
git commit -m "feat: fix Mini App auth, wire privacy settings UI and API"
```

---

### Task 8: Remove Orphaned Files and Clean Up

**Files:**
- Delete: `packages/bot/` — all files moved/ported in Tasks 1-5, ensure nothing remains
- Delete: `packages/frontend/` — all files moved in Task 1
- Delete: `drizzle/` (root — old root-level drizzle dir if it still exists)
- Delete: any leftover references to old structure

**Interfaces:**
- Consumes: clean project state from Tasks 1-7
- Produces: final clean project with no orphaned files

- [ ] **Step 1: Check for orphaned files**

```bash
ls packages/ 2>/dev/null && echo "packages/ still exists" || echo "packages/ cleaned"
ls drizzle/ 2>/dev/null && echo "root drizzle/ still exists" || echo "no root drizzle/"
```

- [ ] **Step 2: Remove any remaining**

```bash
rm -rf packages drizzle 2>/dev/null; true
```

- [ ] **Step 3: Update entrypoint.sh if it references Bun**

```bash
#!/bin/sh
# entrypoint.sh — adapt from Bun to Node if needed
yarn db:migrate
yarn start
```

- [ ] **Step 4: Final verification**

```bash
yarn install
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean up orphaned files from monorepo restructuring"
```

---

### Task 9: Test End-to-End

**Files:**
- No file changes — verification task

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified working system

- [ ] **Step 1: Start the app**

```bash
yarn dev
```

Expected: Next.js dev server starts on port 3032, bot connects to Telegram.

- [ ] **Step 2: Verify bot responds**

Send `/start` to the bot in an allowed chat. Expected: "well cum"

- [ ] **Step 3: Send a voice message**

Send a voice message. Expected: "Transcribing voice message..." → transcription appears → refined version appears.

- [ ] **Step 4: Enable summarization**

Open Mini App, enable summarization for the chat. Send `/summary`. Expected: summary of recent messages.

- [ ] **Step 5: Test privacy**

Opt out globally in Mini App. Send a text message. Verify message appears but has `isHiddenForPrivacy` flag in DB. Delete your data. Verify messages removed.

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
