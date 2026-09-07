import { describe, expect, test } from "bun:test";
import { issueTicket, TICKET_TTL_MS, verifyTicket } from "../server/utils/contact-ticket";

const SECRET = "test-signing-secret";
const NOW = 1_760_000_000_000;

describe("reveal ticket", () => {
  test("a freshly issued ticket verifies", async () => {
    const ticket = await issueTicket(SECRET, NOW);
    expect(await verifyTicket(SECRET, ticket, NOW)).toBe("ok");
  });

  test("verifies right up to the TTL boundary and expires past it", async () => {
    const ticket = await issueTicket(SECRET, NOW);
    expect(await verifyTicket(SECRET, ticket, NOW + TICKET_TTL_MS)).toBe("ok");
    expect(await verifyTicket(SECRET, ticket, NOW + TICKET_TTL_MS + 1)).toBe("expired");
  });

  test("an authentic but aged ticket is 'expired', not 'invalid'", async () => {
    // The endpoint maps these to different statuses: expired triggers a silent
    // client retry, invalid is a hard 403. Collapsing them would either hide
    // forgeries or show humans an error for leaving a tab open.
    const ticket = await issueTicket(SECRET, NOW);
    expect(await verifyTicket(SECRET, ticket, NOW + TICKET_TTL_MS * 2)).toBe("expired");
  });

  test("a ticket signed with another secret is invalid", async () => {
    const ticket = await issueTicket("some-other-secret", NOW);
    expect(await verifyTicket(SECRET, ticket, NOW)).toBe("invalid");
  });

  test("a tampered timestamp is invalid, not merely expired", async () => {
    const ticket = await issueTicket(SECRET, NOW);
    const forged = `${NOW + 5_000}.${ticket.split(".")[1]}`;
    expect(await verifyTicket(SECRET, forged, NOW)).toBe("invalid");
  });

  test("a tampered signature is invalid", async () => {
    const ticket = await issueTicket(SECRET, NOW);
    const [body, signature] = ticket.split(".");
    const flipped = signature!.startsWith("A")
      ? `B${signature!.slice(1)}`
      : `A${signature!.slice(1)}`;
    expect(await verifyTicket(SECRET, `${body}.${flipped}`, NOW)).toBe("invalid");
  });

  test("a far-future timestamp is rejected rather than trusted", async () => {
    const ticket = await issueTicket(SECRET, NOW + 60 * 60 * 1000);
    expect(await verifyTicket(SECRET, ticket, NOW)).toBe("expired");
  });

  test("small backwards clock skew between isolates is tolerated", async () => {
    const ticket = await issueTicket(SECRET, NOW + 5_000);
    expect(await verifyTicket(SECRET, ticket, NOW)).toBe("ok");
  });

  test.each([
    ["empty string", ""],
    ["no separator", "1760000000000"],
    ["empty signature", "1760000000000."],
    ["non-numeric body", "notatimestamp.abcd"],
    ["missing body", ".abcd"],
    ["non-base64 signature", "1760000000000.!!!!"],
    ["overlong input", `1760000000000.${"A".repeat(400)}`],
  ])("rejects malformed ticket: %s", async (_label, value) => {
    expect(await verifyTicket(SECRET, value, NOW)).toBe("invalid");
  });

  test.each([
    ["null", null],
    ["undefined", undefined],
    ["number", 1760000000000],
    ["object", { ticket: "x" }],
    ["array", []],
  ])("rejects non-string ticket: %s", async (_label, value) => {
    expect(await verifyTicket(SECRET, value, NOW)).toBe("invalid");
  });

  test("issued tickets are unforgeable without the secret", async () => {
    // Guards against a regression to an unsigned or trivially derivable token.
    const ticket = await issueTicket(SECRET, NOW);
    const [, signature] = ticket.split(".");
    expect(signature).toBeTruthy();
    expect(signature).not.toContain(String(NOW));
    expect(signature!.length).toBeGreaterThan(20);
  });
});
