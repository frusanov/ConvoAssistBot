import { useState } from "react";

export function useFormState() {
  return useState<"pending" | "loaded" | "error">("pending");
}
