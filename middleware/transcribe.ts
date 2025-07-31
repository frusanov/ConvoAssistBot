import type { Context, MiddlewareFn } from "telegraf";
import { message } from "telegraf/filters";
import { transcriber } from "../lib/transcriber";
import { refiner } from "../lib/refiner";
import type { Message, MessageEntity } from "telegraf/types";

export const transcribeMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next,
) => {
  if (ctx.has(message("voice"))) {
    replyWithTranscription(
      "Transcribing voice message...",
      ctx.message.voice.file_id,
    );
  }

  if (ctx.has(message("video_note"))) {
    replyWithTranscription(
      "Transcribing video note...",
      ctx.message.video_note.file_id,
    );
  }

  async function replyWithTranscription(
    initialMessage: string,
    fileId: string,
    type?: "voice" | "video_note",
  ) {
    const reply = await ctx.reply(initialMessage, {
      reply_parameters: { message_id: ctx.message!.message_id },
    });

    const url = await ctx.telegram.getFileLink(fileId);
    const result = await transcriber(url.href);

    const draftMessage = await ctx.telegram.editMessageText(
      reply.chat.id,
      reply.message_id,
      undefined,
      result.transcription,
    );

    const transcribedFrom = type === "voice" ? "voice message" : "video note";

    if (typeof draftMessage !== "boolean") {
      await ctx.systems.history.storeMessage({
        ...(ctx.message as Message.VoiceMessage),
        text: `Transcribed from ${transcribedFrom}:\n${result.transcription}`,
      });
    }

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

    await ctx.telegram.editMessageText(
      reply.chat.id,
      reply.message_id,
      undefined,
      refined,
      {
        entities: [...transcriptionHeaderEntities, ...summaryHeaderEntities],
      },
    );
  }

  return next();
};
