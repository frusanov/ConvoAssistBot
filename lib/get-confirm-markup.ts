import { Markup } from "telegraf";
import type { CallbackQuery } from "../types";

export const getConfirmMarkup = (
  confirm: CallbackQuery & { text?: string },
  deny?: CallbackQuery & { text?: string },
) => {
  return Markup.inlineKeyboard([
    Markup.button.callback(confirm.text ?? "Confirm", JSON.stringify(confirm)),
    Markup.button.callback(
      deny?.text ?? "Cancel",
      JSON.stringify(
        deny
          ? deny
          : ({
              kind: "reset",
            } satisfies CallbackQuery),
      ),
    ),
  ]);
};
