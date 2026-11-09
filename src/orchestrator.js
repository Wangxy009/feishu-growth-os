const { routeMessage, getAgent } = require("./agents");
const { askAI } = require("./ai");

async function handleMessage(config, message, assignedAgentId = "") {
  const text = String(message || "").trim();
  if (!text) return { reply: "请告诉我你想记录、查询或规划什么。", proposals: [], agent: "计划 Agent" };
  const agent = getAgent(assignedAgentId) || routeMessage(text);
  if (!config.ai.baseUrl || !config.ai.apiKey || !config.ai.model) {
    return {
      agent: agent.name,
      proposals: [],
      reply: "已由「" + agent.name + "」接收。机器人连接成功，但模型API尚未配置；当前不会修改任何数据。"
    };
  }
  const result = await askAI(config.ai, agent, text);
  return { ...result, agent: agent.name };
}

function formatReply(result) {
  const lines = ["【" + result.agent + "】", result.reply];
  if (result.proposals.length) {
    lines.push("", "待确认操作：");
    result.proposals.forEach((proposal, index) => lines.push((index + 1) + ". " + String(proposal.summary || proposal.type || "未命名操作")));
    lines.push("", "当前阶段只展示建议，不会自动写入数据。");
  }
  return lines.join("\n").slice(0, 12000);
}

module.exports = { handleMessage, formatReply };

