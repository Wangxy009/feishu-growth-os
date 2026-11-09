# 飞书 AI 工作台

多角色消息路由原型 · Feishu Growth OS

把学习、英语、科研等不同角色放进飞书工作台。用户私聊机器人，或在群内明确提及某个机器人后，服务将消息路由到对应角色，按配置生成回复。

## 已实现与待接入

| 环节 | 当前实现 |
| --- | --- |
| 角色入口 | 每个可见角色对应一个飞书自建应用，各应用共用 Node.js 服务 |
| 消息接收 | 使用飞书官方 SDK 长连接接收事件 |
| 触发过滤 | 普通群消息、未提及机器人的消息、其他成员与机器人消息在模型调用前被过滤 |
| 角色分派 | 消息进入对应角色的处理流程，调用统一配置的模型接口 |
| 模型未配置 | 返回路由确认，不生成智能回答 |
| 多维表格 | 已有数据表结构方案，读写集成仍属后续工作 |

项目展示的是消息接入、角色划分和触发控制。跨角色自主协作、日历/GitHub 写入与多维表格自动管理仍需继续实现。

## 本地运行

需要 Node.js 20 或更高版本。项目依赖飞书官方 SDK，首次运行先安装依赖。

```bash
npm ci
cp .env.example .env.local
cp config/bots.example.json config/bots.local.json
node src/server.js
```

按示例填写本机配置。飞书端还需创建应用、开启机器人、配置事件订阅并发布版本，步骤见 [控制台配置](docs/FEISHU-CONSOLE-STEPS.md) 和 [多机器人部署](docs/MULTI-BOT-DEPLOYMENT.md)。

健康检查：`http://127.0.0.1:4280/api/health`。接口展示配置数量与调用计数，不返回密钥。持续在线需要常驻进程。

## 检查

```bash
npm test
npm run check
```

## 与 Growth OS 的关系

[Growth OS](https://github.com/Wangxy009/my-growth-os) 提供本地计划与记录界面，本仓库探索飞书中的对话入口。两者独立运行，不能把规划中的共享数据能力视为已完成集成。

## 目录与配置

- `src/`：事件接收、触发过滤、角色分派与模型调用。
- `config/bots.example.json`：多机器人配置示例。
- `config/bitable-schema.json`：后续多维表格的数据结构方案。
- `tests/`：角色、分派、事件处理与编排测试。
- `Dockerfile`：容器运行入口。

`.env.local` 与 `config/bots.local.json` 仅保存在本机，不提交真实密钥。健康相关角色建议仅用于私聊，并单独控制数据权限。
