const assert = require("node:assert/strict");
const test = require("node:test");
const { assignmentAllowed } = require("../src/assignment");

function event(overrides = {}) {
  return {
    sender: { sender_type: "user", sender_id: { open_id: "owner" } },
    message: { message_type: "text", chat_type: "group", mentions: [{ key: "@bot" }] },
    ...overrides
  };
}

test("only an explicit group mention becomes an assignment", () => {
  const bot = { groupMentionOnly: true };
  assert.equal(assignmentAllowed(bot, event(), "owner"), true);
  assert.equal(assignmentAllowed(bot, event({ message: { message_type: "text", chat_type: "group", mentions: [] } }), "owner"), false);
});

test("rejects other users and bot-generated events before model invocation", () => {
  const bot = { groupMentionOnly: true };
  assert.equal(assignmentAllowed(bot, event(), "someone-else"), false);
  assert.equal(assignmentAllowed(bot, event({ sender: { sender_type: "bot", sender_id: { open_id: "owner" } } }), "owner"), false);
});

test("allows an owner to privately assign work without a mention", () => {
  const bot = { groupMentionOnly: true };
  assert.equal(assignmentAllowed(bot, event({ message: { message_type: "text", chat_type: "p2p", mentions: [] } }), "owner"), true);
});
