const lark = require("@larksuiteoapi/node-sdk");

function startLongConnection(config, onEvent, sdk = lark) {
  if (!config.appId || !config.appSecret) return null;
  const dispatcher = new sdk.EventDispatcher({
    verificationToken: config.verificationToken || undefined,
    encryptKey: config.encryptKey || undefined
  }).register({
    "im.message.receive_v1": async data => onEvent(data)
  });
  const client = new sdk.WSClient({
    appId: config.appId,
    appSecret: config.appSecret,
    loggerLevel: sdk.LoggerLevel.info
  });
  client.start({ eventDispatcher: dispatcher }).catch(error => {
    console.error("Feishu long connection failed:", error.message || error);
  });
  return client;
}

function startAgentConnections(bots, onEvent, sdk = lark) {
  return bots.filter(bot => bot.appId && bot.appSecret).map(bot => ({
    bot,
    client: startLongConnection(bot, payload => onEvent(bot, payload), sdk)
  }));
}

module.exports = { startLongConnection, startAgentConnections };

