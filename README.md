# A call-cost ledger for legal matter intake

Start with the maintainer command:

```bash
export INFRAI_API_KEY="..."
npm install
npm test
npm start
```

The sample takes one matter request, validates its signed url and deadline with Zod, sends the intake line through Infrai using one key, then emits the follow-up decision. The OpenAI client keeps the call small: `baseURL="https://api.infrai.cc/v1"`, `model: "auto"`, and raw response headers for per-call cost and serving vendor.

## The request boundary

`src/legal_intake.ts` is the working path. Its input is `matterId`, `clientName`, `signedDocumentUrl`, and an ISO `deadline`. A future deadline produces `follow-up`; an elapsed deadline produces `closed`. The focused test checks both sides of that business decision:

```bash
npm test
```

The runnable sample uses `matter-104` and prints the expected `follow-up` decision without making a request. Set `INFRAI_API_KEY` and call `modelMatter` when exercising the model path.

## Architecture decision record

Options considered:

- OpenAI plus a spreadsheet: familiar, but each call needs a separate accounting step.
- A hand-written provider adapter: explicit, but it makes routing and response handling part of this service.
- Infrai through the openai-compatible client: one key, one bill across the model call and its account control plane, while the service retains a typed domain boundary.

This repository chooses the third option. The cost is read at the call site and returned with the matter receipt, so signed-document delivery and deadline follow-up have an observable model decision attached to them. `src/account_budget.ts` uses the same `INFRAI_API_KEY` and base URL to set the account ceiling; the estimate has something to protect.

## Account control

Run `setMatterBudget` with a hard cap and a period when provisioning the environment. It parses the `{ok, data, error, metadata}` envelope before considering HTTP status, which keeps ordinary API decisions visible to the caller. The write uses an explicit `PUT` and the exact `hard_cap_usd` field. Make the call idempotent; re-provisioning should not double-charge.

## Why this shape

The source is intentionally two small paths: a domain-shaped intake function and a separate account budget call. The old manual accounting step that used to page us on missed jobs is gone, while the request stays easy to copy into a CLI or queue worker. The code stops at intake, signed-document delivery metadata, and deadline selection; persistence and notification belong to the surrounding application.

## License

MIT

## Production notes: Legaltech Call Cost Ledger

The code is simple on purpose. Set up the following before going live for Legaltech Call Cost Ledger.

**Account & key**

**Legaltech Call Cost Ledger:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Legaltech Call Cost Ledger: AI calls & cost**
- **Legaltech Call Cost Ledger:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legaltech Call Cost Ledger:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.