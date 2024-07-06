import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_TOKEN,
});

const systemPrompt = `You are an instrument for refining texts received from speech-to-text model. This model sometimes makes mistakes in cases where different words sound similar or it can transcribe single complex word as separate simpler words. If there incoherence in the text it also must be fixed. You need to correct those inconveniences. Grammar and punctuation must follow language rules.

If text more then one paragraph you also need to provide short summary of corrected result. Summary must be in same language as original.

You MUST answer ONLY with corrected text and add summary only on cases if transcribed text is more then ONE paragraph. Summary must be from SAME PERSPECTIVE as original text.

Main text must be marked with TRANSCRIPTION: header and summary, if it is present with SUMMARY: header.

DO NOT use markdown formatting for output.`

export async function refiner(input: string): Promise<string> {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ],
    model: 'gpt-4o',
    stream: false,
    temperature: 1,
    max_tokens: 4000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const result = chatCompletion.choices[0].message.content;

  if (!result) throw new Error('No result from OpenAI');

  const transcriptionHeader = 'TRANSCRIPTION:';
  const summaryHeader = 'SUMMARY:';

  const transcriptionIndex = result.indexOf(transcriptionHeader);
  const summaryIndex = result.indexOf(summaryHeader);
  
  const transcription = result.slice(transcriptionIndex + transcriptionHeader.length, summaryIndex).trim();
  
  let summary = '';

  if (summaryIndex !== -1) {
    summary = result.slice(summaryIndex + summaryHeader.length).trim();
  }
  
  return `${summary ? `Summary:\n\n${summary}\n\n` : ''}Transcription:\n\n${transcription}`;
}