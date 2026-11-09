const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const { parseEvent, textFromEvent, verifySignature } = require("../src/feishu");

test("accepts a valid callback challenge and verification token", () => {
  const payload = parseEvent(JSON.stringify({ challenge: "abc", token: "token" }), {}, { verificationToken: "token", encryptKey: "" });
  assert.equal(payload.challenge, "abc");
});

test("rejects an invalid verification token", () => {
  assert.throws(() => parseEvent(JSON.stringify({ challenge: "abc", token: "wrong" }), {}, { verificationToken: "token", encryptKey: "" }), /不匹配/);
});

test("checks Feishu request signatures when an encrypt key is configured", () => {
  const raw = "{\"ok\":true}";
  const value = "100" + "nonce" + "secret" + raw;
  const signature = crypto.createHash("sha256").update(value).digest("hex");
  assert.equal(verifySignature({ "x-lark-request-timestamp": "100", "x-lark-request-nonce": "nonce", "x-lark-signature": signature }, raw, "secret"), true);
  assert.equal(verifySignature({ "x-lark-request-timestamp": "100", "x-lark-request-nonce": "nonce", "x-lark-signature": "bad" }, raw, "secret"), false);
});

test("extracts text and removes bot mention placeholders", () => {
  const text = textFromEvent({ header: { event_type: "im.message.receive_v1" }, event: { message: { message_type: "text", content: JSON.stringify({ text: "@_user_1 帮我安排雅思" }), mentions: [{ key: "@_user_1" }] } } });
  assert.equal(text, "帮我安排雅思");
});

test("extracts text from the direct long-connection event shape", () => {
  const text = textFromEvent({ event_type: "im.message.receive_v1", message: { message_type: "text", content: JSON.stringify({ text: "记录高数60分钟" }) } });
  assert.equal(text, "记录高数60分钟");
});

