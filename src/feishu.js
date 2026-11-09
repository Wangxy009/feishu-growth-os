const crypto = require("node:crypto");

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifySignature(headers, rawBody, encryptKey) {
  const signature = headers["x-lark-signature"];
  if (!encryptKey || !signature) return true;
  const value = String(headers["x-lark-request-timestamp"] || "") + String(headers["x-lark-request-nonce"] || "") + encryptKey + rawBody;
  return safeEqual(crypto.createHash("sha256").update(value).digest("hex"), signature);
}

function decryptEvent(encrypted, encryptKey) {
  if (!encryptKey) throw new Error("收到加密事件，但尚未配置 FEISHU_ENCRYPT_KEY。");
  const key = crypto.createHash("sha256").update(encryptKey).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, key.subarray(0, 16));
  const output = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
  return JSON.parse(output);
}

function parseEvent(rawBody, headers, config) {
  if (!verifySignature(headers, rawBody, config.encryptKey)) throw Object.assign(new Error("飞书事件签名验证失败。"), { statusCode: 401 });
  const outer = JSON.parse(rawBody || "{}");
  const payload = outer.encrypt ? decryptEvent(outer.encrypt, config.encryptKey) : outer;
  const token = payload.token || payload.header?.token;
  if (config.verificationToken && !safeEqual(token, config.verificationToken)) throw Object.assign(new Error("飞书 Verification Token 不匹配。"), { statusCode: 401 });
  return payload;
}

function textFromEvent(payload) {
  const event = payload.event || payload;
  const eventType = payload.header?.event_type || payload.event_type;
  if (eventType !== "im.message.receive_v1") return null;
  if (event.message?.message_type !== "text") return null;
  try {
    const content = JSON.parse(event.message.content || "{}");
    let text = String(content.text || "").trim();
    for (const mention of event.message.mentions || []) text = text.replaceAll(mention.key || "", "").trim();
    return text;
  } catch {
    return null;
  }
}

class FeishuClient {
  constructor(config) {
    this.config = config;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async tenantToken() {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;
    if (!this.config.appId || !this.config.appSecret) throw new Error("FEISHU_APP_ID 或 FEISHU_APP_SECRET 尚未配置。");
    const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: this.config.appId, app_secret: this.config.appSecret })
    });
    const payload = await response.json();
    if (!response.ok || payload.code !== 0 || !payload.tenant_access_token) throw new Error("无法获取飞书 tenant_access_token：" + (payload.msg || response.status));
    this.token = payload.tenant_access_token;
    this.tokenExpiresAt = Date.now() + Math.max(60, Number(payload.expire || 7200) - 300) * 1000;
    return this.token;
  }

  async replyText(messageId, text) {
    const token = await this.tenantToken();
    const response = await fetch("https://open.feishu.cn/open-apis/im/v1/messages/" + encodeURIComponent(messageId) + "/reply", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ msg_type: "text", content: JSON.stringify({ text }) })
    });
    const payload = await response.json();
    if (!response.ok || payload.code !== 0) throw new Error("飞书回复失败：" + (payload.msg || response.status));
    return payload.data;
  }
}

module.exports = { FeishuClient, parseEvent, textFromEvent, verifySignature, decryptEvent };

