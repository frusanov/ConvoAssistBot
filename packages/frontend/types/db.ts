import { db } from "@/db";

export type TransactionContext = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
