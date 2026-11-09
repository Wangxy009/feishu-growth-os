const assert = require("node:assert/strict");
const test = require("node:test");
const { routeMessage, getAgent } = require("../src/agents");

test("routes focused requests to one specialist", () => {
  assert.equal(routeMessage("今天做雅思听力并记了80个单词").name, "英语 Agent");
  assert.equal(routeMessage("帮我检查论文文献阅读进度").name, "科研 Agent");
  assert.equal(routeMessage("今天练肩背是否合适").name, "健康 Agent");
});

test("routes cross-module planning to the lead", () => {
  assert.equal(routeMessage("统筹明天的考研、雅思和论文任务").name, "总管 Agent");
});

test("looks up the fixed role behind a visible bot identity", () => {
  assert.equal(getAgent("exam").name, "考研 Agent");
  assert.equal(getAgent("missing"), null);
});

