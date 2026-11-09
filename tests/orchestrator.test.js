const assert = require("node:assert/strict");
const test = require("node:test");
const { handleMessage, formatReply } = require("../src/orchestrator");

test("works in safe setup mode before an AI provider is configured", async () => {
  const result = await handleMessage({ ai: { baseUrl: "", apiKey: "", model: "" } }, "帮我整理SQL项目");
  assert.equal(result.agent, "技能 Agent");
  assert.match(formatReply(result), /模型API尚未配置/);
  assert.deepEqual(result.proposals, []);
});

test("a visible supervisor keeps its assigned role instead of rerouting", async () => {
  const result = await handleMessage({ ai: { baseUrl: "", apiKey: "", model: "" } }, "帮我安排明天任务", "english");
  assert.equal(result.agent, "英语 Agent");
});

