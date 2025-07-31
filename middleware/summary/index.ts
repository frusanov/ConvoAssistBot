import type { Context, MiddlewareFn } from "telegraf";
import { db } from "../../lib/db";
import { messagesTable } from "../../entities/message";
import { openai } from "../../lib/shared/openai";
import { editedMessage, message } from "telegraf/filters";

export const summaryMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (ctx.systems.command?.name !== "summary") return await next();

  if (!ctx.systems.chat.data.settings.saveHistory) {
    ctx.reply("History is disabled. Summary is not available.");
    return;
  }

  const args = ctx.systems.command.args;

  const limit = parseInt(args[0]) || 100;
  const messages = await db.select().from(messagesTable).limit(limit);

  const messagesString = messages
    .map((message) => {
      const fullName =
        `${message.data.from?.first_name || ""} ${message.data.from?.last_name || ""}`.trim();

      return `From: ${fullName || message.data.from?.username || message.data.from?.id}\nMessage: ${message.data.text}`;
    })
    .join("\n\n- - -\n\n");

  const message = await ctx.telegram.sendMessage(
    ctx.chat!.id,
    "Summarizing...",
    {
      reply_parameters: { message_id: ctx.message!.message_id },
    },
  );

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
      message.message_id,
      undefined,
      chatCompletion.choices[0].message.content || "",
    );
  } catch {
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      message.message_id,
      undefined,
      "Error occurred while summarizing messages.",
    );
  }

  await next();
};
