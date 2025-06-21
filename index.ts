import { Telegraf } from "telegraf";
import { transcriber } from "./lib/transcriber";
import { refiner } from "./lib/refiner";
import type { MessageEntity } from "telegraf/types";

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN must be provided!");
if (!process.env.ADMIN_USERS) throw new Error("ADMIN_USERS must be provided!");
if (!process.env.ALLOWED_GROUPS)
  throw new Error("ALLOWED_GROUPS must be provided!");

function parseIdList(list: string): number[] {
  return list
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map(Number);
}

const adminUsers = parseIdList(process.env.ADMIN_USERS);
const allowedGroups = parseIdList(process.env.ALLOWED_GROUPS);

const idsCombined = [...adminUsers, ...allowedGroups];

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("well cum"));

bot.use(async (ctx, next) => {
  const start = new Date();

  const chat = ctx.chat;

  // Ignore old messages
  if (
    ctx.message?.date &&
    new Date().getTime() / 1000 - ctx.message.date > 60
  ) {
    console.log("Ignoring old message");
    return next();
  }

  if (!idsCombined.includes(chat?.id as number)) {
    ctx.reply("You are not allowed to use this bot");
    return next();
  }

  type HasFileId = {
    file_id: string;
  };

  if ((ctx.message as any)?.voice as HasFileId) {
    replyWithTranscription(
      "Transcribing voice message...",
      (ctx.message as any).voice.file_id,
    );
  }

  if ((ctx.message as any)?.video_note as HasFileId) {
    replyWithTranscription(
      "Transcribing video note...",
      (ctx.message as any).video_note.file_id,
    );
  }

  async function replyWithTranscription(
    initialMessage: string,
    fileId: string,
  ) {
    const reply = await ctx.reply(initialMessage, {
      reply_parameters: { message_id: ctx.message!.message_id },
    });

    const url = await ctx.telegram.getFileLink(fileId);
    const result = await transcriber(url.href);

    ctx.telegram.editMessageText(
      reply.chat.id,
      reply.message_id,
      undefined,
      result.transcription,
    );

    const refined = await refiner(result.transcription);

    const transcriptionHeader = "Transcription:";
    const summaryHeader = "Summary:";

    const transcriptionIndex = refined.indexOf(transcriptionHeader);
    const summaryIndex = refined.indexOf(summaryHeader);

    const transcriptionHeaderEntities: Array<MessageEntity> = [
      {
        type: "bold",
        offset: transcriptionIndex,
        length: transcriptionHeader.length,
      },
      {
        type: "underline",
        offset: transcriptionIndex,
        length: transcriptionHeader.length,
      },
    ];
    const summaryHeaderEntities: Array<MessageEntity> =
      summaryIndex !== -1
        ? [
            {
              type: "bold",
              offset: summaryIndex,
              length: summaryHeader.length,
            },
            {
              type: "underline",
              offset: summaryIndex,
              length: summaryHeader.length,
            },
          ]
        : [];

    ctx.telegram.editMessageText(
      reply.chat.id,
      reply.message_id,
      undefined,
      refined,
      {
        entities: [...transcriptionHeaderEntities, ...summaryHeaderEntities],
      },
    );
  }

  return next().then(() => {
    const ms = new Date().getTime() - start.getTime();
    console.log("Response time: %sms", ms);
  });
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
