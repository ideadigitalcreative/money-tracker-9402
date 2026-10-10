import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { financialDocuments } from "../database/schema";
import { emptyFinance, financeSchema } from "../../shared/finance";
export async function readFinance(userId: string) {
  let [row] = await db
    .select()
    .from(financialDocuments)
    .where(eq(financialDocuments.userId, userId));
  if (!row) {
    await db
      .insert(financialDocuments)
      .values({
        userId,
        data: JSON.stringify(emptyFinance()),
        revision: 0,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing();
    [row] = await db.select().from(financialDocuments).where(eq(financialDocuments.userId, userId));
  }
  return {
    state: financeSchema.parse(JSON.parse(row!.data)),
    revision: row!.revision,
    updatedAt: row!.updatedAt,
  };
}
export const finance = {
  read: authed.handler(({ context }) => readFinance(context.user.id)),
  save: authed
    .input(z.object({ state: financeSchema, revision: z.number().int().nonnegative() }))
    .handler(async ({ context, input }) => {
      const updatedAt = new Date().toISOString();
      const [row] = await db
        .update(financialDocuments)
        .set({ data: JSON.stringify(input.state), revision: input.revision + 1, updatedAt })
        .where(
          and(
            eq(financialDocuments.userId, context.user.id),
            eq(financialDocuments.revision, input.revision),
          ),
        )
        .returning();
      if (!row)
        throw new ORPCError("CONFLICT", {
          message: "Data changed on another device. Reload and try again.",
        });
      return { state: input.state, revision: row.revision, updatedAt };
    }),
};
