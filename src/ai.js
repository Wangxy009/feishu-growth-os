function assertAIConfig(config) {
  if (!config.baseUrl || !config.apiKey || !config.model) throw new Error("AI 服务尚未配置。当前可以先完成飞书机器人和数据表连接。");
  const url = new URL(config.baseUrl);
  const loopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) throw new Error("AI_API_BASE_URL 必须使用 HTTPS；本机模型可以使用 localhost。");
}

function parseAnswer(content) {
  const text = Array.isArray(content) ? content.map(part => part.text || "").join("") : String(content || "");
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      reply: String(parsed.reply || "").trim() || "AI 没有返回有效回复。",
      proposals: Array.isArray(parsed.proposals) ? parsed.proposals.slice(0, 10) : []
    };
  } catch {
    return { reply: cleaned || "AI 没有返回有效回复。", proposals: [] };
  }
}

async function askAI(config, agent, message) {
  assertAIConfig(config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const system = [
    "你是 My Growth OS 飞书 AI 团队的一员。用户是老板，你的角色是：" + agent.name + "。",
    "职责：" + agent.scope + "。",
    agent.prompt,
    "只依据用户明确提供的数据回答；不声称已写入飞书、发送消息、修改日历或完成外部操作。",
    "输出严格JSON：{\"reply\":\"中文回复\",\"proposals\":[{\"type\":\"候选操作类型\",\"summary\":\"待确认操作\"}]}。",
    "涉及写入、删除、改期、投递、发布或发送时，必须放入proposals等待用户确认。"
  ].join("\n");
  try {
    const response = await fetch(config.baseUrl + "/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, messages: [{ role: "system", content: system }, { role: "user", content: message }], temperature: 0.2, max_tokens: 1400 }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("AI 服务返回 HTTP " + response.status + "。请检查地址、模型和额度。");
    const payload = await response.json();
    return parseAnswer(payload?.choices?.[0]?.message?.content);
  } catch (error) {
    if (error.name === "AbortError") throw new Error("AI 请求超过30秒，请稍后重试。");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { askAI, assertAIConfig, parseAnswer };

