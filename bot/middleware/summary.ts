import type { Context, MiddlewareFn } from "telegraf";
import { messageQueries } from "@/db/queries/messages";
import { openai } from "../lib/openai";

export const summaryMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (ctx.systems.command?.name !== "summary") return await next();

  const chatSettings = ctx.chatData.settings as { summarize?: boolean };
  if (!chatSettings.summarize) {
    await ctx.reply(
      "Summarization is not enabled for this chat. Ask an admin to enable it in settings.",
    );
    return;
  }

  const args = ctx.systems.command.args;
  const limit = parseInt(args[0]) || 100;

  const messages = await messageQueries.listMessagesByChat(
    ctx.chatData.id,
    limit,
  );

  // Filter out hidden messages
  const visibleMessages = messages.filter((m) => !m.isHiddenForPrivacy);

  if (visibleMessages.length === 0) {
    await ctx.reply("No messages to summarize.");
    return;
  }

  const messagesString = visibleMessages
    .map((msg) => `Message: ${msg.text}`)
    .join("\n\n- - -\n\n");

  const statusMsg = await ctx.reply("Summarizing...", {
    reply_parameters: { message_id: ctx.message!.message_id },
  });

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Please summarize the received list of messages. Summary must be in the same language as the majority of the messages. Output only the summary.",
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
