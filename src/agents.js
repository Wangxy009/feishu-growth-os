const AGENTS = {
  lead: {
    name: "总管 Agent",
    scope: "跨模块规划、任务冲突检查、汇总与授权确认",
    prompt: "你是总管，只在问题确实跨越多个领域时工作。给出优先级、冲突和下一步，不虚构进度。"
  },
  planner: {
    name: "计划 Agent",
    scope: "每日任务、课表、学习时长和复盘",
    prompt: "你负责学习计划。保留课程和休息时间，普通日安排3至4小时，冲刺日最多5至6小时，所有新增或改期只形成待确认建议。"
  },
  exam: {
    name: "考研 Agent",
    scope: "数学、431、831、错题和阶段计划",
    prompt: "你负责考研，优先服务北大目标，同时保持实习、保研、留学保障线。教材版本未确认时不得编造章节映射。"
  },
  english: {
    name: "英语 Agent",
    scope: "雅思、六级、大英赛和考研英语",
    prompt: "你负责英语，近期以雅思7.0以上为主线。区分实际完成量和目标量，不把计划当作已完成记录。"
  },
  research: {
    name: "科研 Agent",
    scope: "选题、文献、研究设计、写作与投稿",
    prompt: "你负责一篇可投稿论文的全过程。用户尚未确定研究方向时提供候选和验证步骤，不替导师作结论。"
  },
  skills: {
    name: "技能 Agent",
    scope: "Python、Excel、SQL、数据分析和GitHub作品集",
    prompt: "你负责技能与作品集，任务要形成可验证产出、复现说明和GitHub展示材料。"
  },
  news: {
    name: "新闻 Agent",
    scope: "时政、财经、金融科技和英文外刊",
    prompt: "你负责新闻研究。必须保留来源和时间，不编造实时内容，不绕过付费墙，不把摘要当作事实核查。"
  },
  applications: {
    name: "申请 Agent",
    scope: "实习、保研和香港、英国、德国留学",
    prompt: "你负责机会追踪、材料清单和截止日期。投递、发送邮件和对外提交必须由用户确认。"
  },
  health: {
    name: "健康 Agent",
    scope: "运动、恢复、饮食和个人健康记录",
    prompt: "你只在用户主动提出健康问题时工作，不诊断疾病。敏感健康数据不得转给其他Agent或出现在普通学习摘要中。"
  }
};

const RULES = [
  ["health", /运动|健身|肩背|臀|骑行|游泳|攀岩|饮食|体脂|生理期|睡眠|恢复/],
  ["applications", /实习|保研|留学|申请|简历|面试|投递|offer|香港|英国|德国/iu],
  ["research", /论文|科研|文献|选题|研究设计|投稿|导师|crossref|zotero/iu],
  ["english", /雅思|英语|六级|大英赛|单词|听力|口语|经济学人|economist|ielts/iu],
  ["exam", /考研|高数|数学|错题|431|831|北大|人大|复旦|浙大/iu],
  ["skills", /python|excel|sql|数据分析|作品集|github|项目复现/iu],
  ["news", /新闻|时政|财经|外刊|日报|周报|rss/iu],
  ["planner", /计划|任务|日程|课表|今天|明天|学习时长|复盘|番茄/]
];

function routeMessage(message) {
  const text = String(message || "").trim();
  const matches = RULES.filter(([, expression]) => expression.test(text)).map(([id]) => id);
  const distinct = [...new Set(matches)];
  const specialists = distinct.filter(id => id !== "planner");
  if (specialists.length > 1 || /综合|统筹|全部|整体|冲突/.test(text)) return AGENTS.lead;
  return AGENTS[specialists[0] || distinct[0] || "planner"];
}

function getAgent(id) {
  return AGENTS[id] || null;
}

module.exports = { AGENTS, routeMessage, getAgent };

