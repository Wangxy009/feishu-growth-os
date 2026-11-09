# Feishu Growth OS

以飞书作为工作台的个人 AI 团队。每个主管是工作群中的独立机器人身份，所有主管共用一个部署服务、数据库和模型账户。只有主人私聊或在群内明确 `@` 某个主管时，才会调用该主管对应的 Agent。

## 架构

```text
Kiya总管 ─┐
考研主管 ─┤
英语主管 ─┤  官方SDK长连接  <->  共享服务  ->  模型API
科研主管 ─┤                              ->  飞书多维表格（下一阶段）
其他主管 ─┘
```

每个可见主管对应一个飞书自建应用。一个应用只能显示一个机器人身份，因此需要为不同主管分别创建应用；代码和部署不需要复制。普通群消息、未 `@` 的消息、其他成员消息和机器人消息都在模型调用前被拦截。

## 本地运行

Node.js 20 或更高版本，无第三方依赖。

```bash
cp .env.example .env.local
cp config/bots.example.json config/bots.local.json
node src/server.js
```

检查服务：`http://127.0.0.1:4280/api/health`。逐个填写 `config/bots.local.json` 后，服务会为每个主管建立独立长连接。健康接口只显示数量和调用计数，不返回密钥。

运行测试：

```bash
npm test
npm run check
```

`.env.local` 与 `config/bots.local.json` 只保存在本机并已忽略。健康数据表必须单独限制权限，健康主管建议只私聊，不加入普通工作群。

## 当前边界

- 尚未配置各主管应用时，只能做本地测试。
- 尚未配置模型 API 时，机器人会确认已路由到哪个 Agent，但不会生成智能回答。
- 当前只返回建议，不会修改多维表格、日历、GitHub 或对外发送内容。
- 默认使用官方 SDK 长连接，本地即可接收飞书事件；要全天在线必须部署到持续运行的云服务器或容器服务。
- 密钥、登录、验证码、应用发布和权限批准必须由用户本人完成。

多主管配置与部署见 `docs/MULTI-BOT-DEPLOYMENT.md`，控制台步骤见 `docs/FEISHU-CONSOLE-STEPS.md`，数据表方案见 `config/bitable-schema.json`。

