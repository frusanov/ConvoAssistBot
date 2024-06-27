import { Telegraf } from 'telegraf';
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN must be provided!');
if (!process.env.ADMIN_USERS) throw new Error('ADMIN_USERS must be provided!');
if (!process.env.ALLOWED_GROUPS) throw new Error('ALLOWED_GROUPS must be provided!');

function parseIdList(list: string): number[] {
  return list.split(',').map(u=>u.trim()).filter(Boolean).map(Number);
}

const adminUsers = parseIdList(process.env.ADMIN_USERS);
const allowedGroups = parseIdList(process.env.ALLOWED_GROUPS);

const idsCombined = [...adminUsers, ...allowedGroups];
 
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('well cum'));

async function transcribeVoice(url: string) {
  const output = await replicate.run(
    "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
    {
      input: {
        audio: url,
        model: "large-v3",
        language: "ru",
        translate: false,
        temperature: 0,
        transcription: "plain text",
        suppress_tokens: "-1",
        logprob_threshold: -1,
        no_speech_threshold: 0.6,
        condition_on_previous_text: true,
        compression_ratio_threshold: 2.4,
        temperature_increment_on_fallback: 0.2
      }
    }
  );

  return output as {
    transcription: string;
  };
}

bot.use(async (ctx, next) => {
    const start = new Date()

    const chat = ctx.chat;

    // Ignore old messages
    if (ctx.message?.date && (new Date().getTime() / 1000 - ctx.message.date) > 60) {
      return next();
    }

    if (!idsCombined.includes(chat?.id as number)) {
      ctx.reply('You are not allowed to use this bot');
      return next();
    }

    type HasFileId = {
      file_id: string;
    }

    if ((ctx.message as any)?.voice as HasFileId) {
      const reply = await ctx.reply('Transcribing voice message...', { reply_parameters: { message_id: ctx.message!.message_id } });

      const url = await ctx.telegram.getFileLink((ctx.message as any).voice.file_id)
      const result = await transcribeVoice(url.href);

      ctx.telegram.editMessageText(reply.chat.id, reply.message_id, undefined, result.transcription);      
    }

    if ((ctx.message as any)?.video_note as HasFileId) {
      const reply = await ctx.reply('Transcribing video note...', { reply_parameters: { message_id: ctx.message!.message_id } });

      const url = await ctx.telegram.getFileLink((ctx.message as any).video_note.file_id)
      const result = await transcribeVoice(url.href);

      ctx.telegram.editMessageText(reply.chat.id, reply.message_id, undefined, result.transcription);  
    }

    return next().then(() => {
      const ms = new Date().getTime() - start.getTime()
      console.log('Response time: %sms', ms)
    })
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))