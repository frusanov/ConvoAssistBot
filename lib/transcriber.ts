import { fetch } from "bun";
import { openai } from "./shared/openai";

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
