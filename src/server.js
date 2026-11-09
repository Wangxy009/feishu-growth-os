const http = require("node:http");
const { readConfig, readiness } = require("./config");
const { FeishuClient, parseEvent, textFromEvent } = require("./feishu");
const { handleMessage, formatReply } = require("./orchestrator");
const { startAgentConnections } = require("./long-connection");
const { assignmentAllowed } = require("./assignment");

const config = readConfig();
const feishuClients = new Map(config.bots.filter(bot => bot.appId && bot.appSecret).map(bot => [bot.id, new FeishuClient(bot)]));
const seenEvents = new Map();
const usage = { acceptedAssignments: 0, ignoredEvents: 0, modelRequests: 0 };

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

function readBody(request, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("请求内容过大。"), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function rememberEvent(id) {
  if (!id) return true;
  const now = Date.now();
  for (const [key, time] of seenEvents) if (now - time > 10 * 60 * 1000) seenEvents.delete(key);
  if (seenEvents.has(id)) return false;
  seenEvents.set(id, now);
  return true;
}

async function processEvent(bot, payload) {
  if (!assignmentAllowed(bot, payload, config.ownerOpenId)) {
    usage.ignoredEvents += 1;
    return;
  }
  const text = textFromEvent(payload);
  const event = payload.event || payload;
  const messageId = event.message?.message_id;
  if (!text || !messageId) return;
  const feishu = feishuClients.get(bot.id);
  if (!feishu) return;
  usage.acceptedAssignments += 1;
  try {
    if (config.ai.baseUrl && config.ai.apiKey && config.ai.model) usage.modelRequests += 1;
    const result = await handleMessage(config, text, bot.agentId);
    await feishu.replyText(messageId, formatReply(result));
  } catch (error) {
    console.error("Unable to process Feishu message:", error.message);
    try { await feishu.replyText(messageId, "处理失败：" + error.message); } catch (replyError) { console.error("Unable to send error reply:", replyError.message); }
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "feishu-growth-os", readiness: readiness(config), usage });
    return;
  }
  if (request.method === "POST" && url.pathname === "/feishu/events") {
    try {
      const rawBody = await readBody(request);
      const payload = parseEvent(rawBody, request.headers, config.feishu);
      if (payload.challenge) {
        sendJson(response, 200, { challenge: payload.challenge });
        return;
      }
      const eventId = payload.header?.event_id;
      sendJson(response, 200, { code: 0 });
      if (rememberEvent(eventId) && config.bots[0]) setImmediate(() => processEvent(config.bots[0], payload));
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "无效的飞书事件。" });
    }
    return;
  }
  sendJson(response, 404, { error: "Not found" });
});

let connections = [];

server.listen(config.port, config.host, () => {
  console.log("Feishu Growth OS listening on http://" + config.host + ":" + config.port);
  console.log("Health: http://" + config.host + ":" + config.port + "/api/health");
  connections = startAgentConnections(config.bots, (bot, payload) => {
    if (rememberEvent(bot.id + ":" + payload.event_id)) return processEvent(bot, payload);
  });
  console.log(connections.length ? "Feishu supervisors connected: " + connections.map(item => item.bot.name).join(", ") : "Feishu event mode: setup (bot credentials not configured)");
});

function shutdown() {
  connections.forEach(item => item.client?.close({ force: true }));
  server.close(() => process.exit(0));
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

module.exports = { readBody, rememberEvent };

