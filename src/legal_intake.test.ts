import { strict as assert } from "node:assert";
import { followUpDecision, matterRequest } from "./legal_intake.ts";

const request = matterRequest.parse({
  matterId: "matter-104",
  clientName: "Northwind Legal",
  signedDocumentUrl: "https://example.test/signed/matter-104",
  deadline: "2030-06-30T17:00:00.000Z",
});

assert.equal(followUpDecision(request, new Date("2030-06-01T00:00:00.000Z")), "follow-up");
assert.equal(followUpDecision(request, new Date("2030-07-01T00:00:00.000Z")), "closed");
console.log("deadline decision test passed");
