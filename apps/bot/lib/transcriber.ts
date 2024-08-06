import { replicate } from "./shared/replicate";

export async function transcriber(url: string) {
  const output = await replicate.run(
    "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
    {
      input: {
        task: "transcribe",
        audio: url,
        language: "None",
        timestamp: "chunk",
        batch_size: 64,
        diarise_audio: false
      }
    }
  );

  return {
    transcription: (output as any).text,
  } as {
    transcription: string;
  };
}