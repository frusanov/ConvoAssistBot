export type CallbackQueryKind =
  | "reset"
  | "confirmChangeSettings"
  | "exitSettings"
  | "confirmSaveHistory"
  | "denySaveHistory";

export interface CallbackQuery {
  kind: CallbackQueryKind;
  payload?: Record<string, any>;
}
