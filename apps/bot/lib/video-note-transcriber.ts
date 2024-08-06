import { replicate } from "./shared/replicate";

export async function videoNoteTranscriber(url: string) {
  const output = await replicate.run(
    "openai/whisper:3c08daf437fe359eb158a5123c395673f0a113dd8b4bd01ddce5936850e2a981",
    {
      input: {
        audio: url,
        model: "large-v3",
        language: "auto",
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