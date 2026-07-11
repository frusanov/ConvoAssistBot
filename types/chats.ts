export interface ChatSetings {
  transcribe: boolean;
  summarize: boolean;
  storeMessages: {
    amount: number;
    /**
     * Seconds
     */
    time: number;
  };
}
