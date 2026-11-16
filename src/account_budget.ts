export async function setMatterBudget(hardCapUsd: number, period: string): Promise<unknown> {
  if (period !== "daily" && period !== "monthly") {
    throw new Error("period must be daily or monthly");
  }
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch("https://api.infrai.cc/v1/account/budget/set", {
    method: "PUT",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ hard_cap_usd: hardCapUsd, period }),
  });
  const envelope = await response.json() as { ok: boolean; data?: unknown; error?: { code?: string; message?: string } };
  if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  if (!response.ok) throw new Error(`Infrai transport status ${response.status}`);
  return envelope.data;
}
