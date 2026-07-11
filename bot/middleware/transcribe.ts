import type { Context, MiddlewareFn } from "telegraf";
import type { Message } from "telegraf/types";
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

  const fileId = isVoice
    ? ctx.message.voice.file_id
    : ctx.message.video_note.file_id;
  const type = isVoice ? "voice" : "video_note";

  const reply = await ctx.reply(
    "Transcribing " + (type === "voice" ? "voice message" : "video note") + "...",
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
    const label = type === "voice" ? "voice message" : "video note";
    const fakeTextMessage = {
      ...ctx.message,
      text: "Transcribed from " + label + ":\n" + result.transcription,
    } as unknown as Message.TextMessage;

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
    {
      type: "bold" as const,
      offset: transcriptionIndex,
      length: transcriptionHeader.length,
    },
    {
      type: "underline" as const,
      offset: transcriptionIndex,
      length: transcriptionHeader.length,
    },
  ];

  const summaryHeaderEntities =
    summaryIndex !== -1
      ? [
          {
            type: "bold" as const,
            offset: summaryIndex,
            length: summaryHeader.length,
          },
          {
            type: "underline" as const,
            offset: summaryIndex,
            length: summaryHeader.length,
          },
        ]
      : [];

  await ctx.telegram.editMessageText(
    reply.chat.id,
    reply.message_id,
    undefined,
    refined,
    {
      entities: [...transcriptionHeaderEntities, ...summaryHeaderEntities],
    },
  );

  await next();
};
