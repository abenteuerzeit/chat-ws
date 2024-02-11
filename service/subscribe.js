const WebSocket = require('ws');
const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const { HUBNAME } = require('../utils/constants.js');


async function subscribe() {
  let serviceClient = new WebPubSubServiceClient(process.env.WebPubSubConnectionString, HUBNAME);
  let token = await serviceClient.getClientAccessToken();
  let ws = new WebSocket(token.url);
  ws.on('open', () => console.log('connected'));
  ws.on('message', data => console.log('Message received: %s', data));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = exports = {
    subscribe
    }
}
