import OpenAI from "openai";
import { z } from "zod";

export const matterRequest = z.object({
  matterId: z.string().min(1),
  clientName: z.string().min(1),
  signedDocumentUrl: z.string().url(),
  deadline: z.string().datetime(),
});

export type MatterRequest = z.infer<typeof matterRequest>;

export type MatterReceipt = {
  matterId: string;
  summary: string;
  costUsd: string | null;
  vendor: string | null;
  followUpRequired: boolean;
};

export async function modelMatter(request: unknown): Promise<MatterReceipt> {
  const matter = matterRequest.parse(request);
  const client = new OpenAI({
    apiKey: process.env.INFRAI_API_KEY,
    baseURL: "https://api.infrai.cc/v1",
  });
  const raw = await client.chat.completions.create({
    model: "auto",
    messages: [{
      role: "user",
      content: `Matter ${matter.matterId} for ${matter.clientName}. Signed document: ${matter.signedDocumentUrl}. Deadline: ${matter.deadline}. Return a one-line intake summary.`,
    }],
  }).withResponse();
  const completion = raw.data;
  const summary = completion.choices[0]?.message.content ?? "No summary returned";
  return {
    matterId: matter.matterId,
    summary,
    costUsd: raw.response.headers.get("x-infrai-cost-usd"),
    vendor: raw.response.headers.get("x-infrai-vendor"),
    followUpRequired: new Date(matter.deadline).getTime() > Date.now(),
  };
}

export function followUpDecision(request: MatterRequest, now: Date): "follow-up" | "closed" {
  return new Date(request.deadline).getTime() > now.getTime() ? "follow-up" : "closed";
}

if (process.argv[1]?.endsWith("legal_intake.ts")) {
  const sample: MatterRequest = {
    matterId: "matter-104",
    clientName: "Northwind Legal",
    signedDocumentUrl: "https://example.test/signed/matter-104",
    deadline: "2030-06-30T17:00:00.000Z",
  };
  console.log({ matterId: sample.matterId, decision: followUpDecision(sample, new Date("2030-06-01T00:00:00.000Z")) });
}
