function assignmentAllowed(bot, payload, ownerOpenId = "") {
  const event = payload.event || payload;
  const sender = event.sender || {};
  const message = event.message || {};
  if (sender.sender_type && sender.sender_type !== "user") return false;
  const senderOpenId = sender.sender_id?.open_id || "";
  if (ownerOpenId && senderOpenId !== ownerOpenId) return false;
  if (message.message_type !== "text") return false;
  if (message.chat_type !== "p2p" && bot.groupMentionOnly && !(message.mentions || []).length) return false;
  return true;
}

module.exports = { assignmentAllowed };
