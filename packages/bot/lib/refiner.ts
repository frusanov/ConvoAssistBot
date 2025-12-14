import { openai } from "./shared/openai";

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
    Hey, just saw this quick little brown fox leap right over a lazy dog lying on the ground. The dog didn’t even care—just stayed there like nothing happened. The fox was gone in a flash. Kinda funny, actually.

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
