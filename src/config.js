const fs = require("node:fs");
const path = require("node:path");

function loadEnvironment(file = path.join(__dirname, "..", ".env.local")) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.prototype.hasOwnProperty.call(process.env, match[1])) continue;
    process.env[match[1]] = match[2].replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted ?? "");
  }
}

function parseBots(value) {
  if (!value) return [];
  const bots = JSON.parse(value);
  if (!Array.isArray(bots)) throw new Error("飞书机器人配置必须是 JSON 数组。");
  const ids = new Set();
  return bots.map((bot, index) => {
    if (!bot || typeof bot !== "object" || Array.isArray(bot)) throw new Error("第 " + (index + 1) + " 个机器人配置无效。");
    const normalized = {
      id: String(bot.id || "").trim(),
      name: String(bot.name || bot.id || "").trim(),
      agentId: String(bot.agentId || bot.id || "").trim(),
      appId: String(bot.appId || "").trim(),
      appSecret: String(bot.appSecret || "").trim(),
      verificationToken: String(bot.verificationToken || "").trim(),
      encryptKey: String(bot.encryptKey || "").trim(),
      groupMentionOnly: bot.groupMentionOnly !== false,
      privateRecommended: bot.privateRecommended === true
    };
    if (!normalized.id || ids.has(normalized.id)) throw new Error("机器人 id 不能为空且不能重复。");
    ids.add(normalized.id);
    return normalized;
  });
}

function loadBots(root = path.join(__dirname, "..")) {
  if (String(process.env.FEISHU_BOTS_JSON || "").trim()) return parseBots(process.env.FEISHU_BOTS_JSON);
  const relative = String(process.env.FEISHU_BOTS_FILE || "config/bots.local.json").trim();
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return [];
  return parseBots(fs.readFileSync(file, "utf8"));
}

function readConfig() {
  loadEnvironment();
  const bots = loadBots();
  return {
    host: String(process.env.HOST || "127.0.0.1").trim(),
    port: Number(process.env.PORT || 4280),
    ownerOpenId: String(process.env.FEISHU_OWNER_OPEN_ID || "").trim(),
    bots,
    feishu: {
      ...(bots[0] || {}),
      bitableAppToken: String(process.env.FEISHU_BITABLE_APP_TOKEN || "").trim()
    },
    ai: {
      baseUrl: String(process.env.AI_API_BASE_URL || "").trim().replace(/\/+$/, ""),
      apiKey: String(process.env.AI_API_KEY || "").trim(),
      model: String(process.env.AI_MODEL || "").trim()
    }
  };
}

function readiness(config) {
  return {
    configuredBots: config.bots.filter(bot => bot.appId && bot.appSecret).length,
    totalBots: config.bots.length,
    ownerRestricted: Boolean(config.ownerOpenId),
    bitable: Boolean(config.feishu.bitableAppToken),
    ai: Boolean(config.ai.baseUrl && config.ai.apiKey && config.ai.model)
  };
}

module.exports = { loadEnvironment, parseBots, loadBots, readConfig, readiness };

