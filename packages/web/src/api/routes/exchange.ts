import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { currencies, currencySchema } from "../../shared/finance";
const rateSchema = z.array(
  z.object({
    date: z.string(),
    base: currencySchema,
    quote: currencySchema,
    rate: z.number().positive(),
  }),
);
type Rates = z.infer<typeof rateSchema>;
const cache = new Map<string, { at: number; rates: Rates }>();
export async function getRates(base: string) {
  const cached = cache.get(base);
  if (cached && Date.now() - cached.at < 3600000) return cached.rates;
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${currencies.filter((c) => c !== base).join(",")}`,
      { signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok) throw new Error("FX unavailable");
    const rates = rateSchema.parse(await response.json());
    if (rates.length !== 5) throw new Error("Incomplete rates");
    cache.set(base, { at: Date.now(), rates });
    return rates;
  } catch {
    throw new ORPCError("SERVICE_UNAVAILABLE", {
      message: "Exchange rates unavailable. Same-currency reports still work; try again later.",
    });
  }
}
export const exchange = {
  rates: authed
    .input(z.object({ base: currencySchema }))
    .handler(({ input }) => getRates(input.base)),
};
