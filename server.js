///////////////////////////////////////////////
///////////// IMPORTS + VARIABLES /////////////
///////////////////////////////////////////////

const http = require('http');
const CONSTANTS = require('./utils/constants.js');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const OpenAI = require('openai');

const { PORT, CLIENT, SERVER } = CONSTANTS;

///////////////////////////////////////////////
///////////// OpenAI Configuration ////////////
///////////////////////////////////////////////

let chatHistory = [];


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT4MultiUserChat = [
  { role: "system", content: "You are a helpful assistant designed to interact with multiple users in a chatroom. Respond to each message considering the user's context. If a new user joins, adapt quickly to assist them as well." },
];

async function GPT4MultiUserResponse(chatHistory) {
  const messagesWithUserInfo = chatHistory.map(msg => {
    const contentWithUserInfo = `[User: ${msg.userId}] ${msg.content}`;
    return {
      role: msg.role,
      content: contentWithUserInfo
    };
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messagesWithUserInfo,
  });

  return response.choices[0].message.content;
}

///////////////////////////////////////////////
///////////// HTTP SERVER LOGIC ///////////////
///////////////////////////////////////////////

const server = http.createServer((req, res) => {
  const filePath = (req.url === '/') ? '/public/index.html' : req.url;

  // determine the contentType by the file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  if (extname === '.js') contentType = 'text/javascript';
  else if (extname === '.css') contentType = 'text/css';

  // pipe the proper file to the res object
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(`${__dirname}/${filePath}`, 'utf8').pipe(res);
});

///////////////////////////////////////////////
////////////////// WS LOGIC ///////////////////
///////////////////////////////////////////////

const wsServer = new WebSocket.Server({ server });

wsServer.on('connection', (socket) => {
  console.log('A new client has connected to the server! :)');

  socket.on('message', async (data) => {
    console.log(data);

    const { type, payload } = JSON.parse(data);

    switch (type) {
      case CLIENT.MESSAGE.NEW_USER:
        const time = new Date().toLocaleString();
        payload.time = time;
        const dataWithTime = {
          type: SERVER.BROADCAST.NEW_USER_WITH_TIME,
          payload
        }
        broadcast(JSON.stringify(dataWithTime));
        break;
      case CLIENT.MESSAGE.NEW_MESSAGE:
        chatHistory.push({
          role: "user",
          content: payload.message,
          userId: payload.username
        });
        
        broadcast(data, socket);

        // GPT Response 
        try {
          const gptResponse = await GPT4MultiUserResponse(chatHistory);

          const gptPayload = {
            ...payload,
            message: gptResponse,
            username: "GPT-4"
          };

          chatHistory.push({ role: "assistant", content: gptResponse, userId: 'GPT-4' });

          broadcast(JSON.stringify({ type: CLIENT.MESSAGE.NEW_MESSAGE, payload: gptPayload }));
        } catch (error) {
          console.error("Error getting response from GPT-4:", error);
        }
        
        break;
      default:
        break;
    }
  });
});

///////////////////////////////////////////////
////////////// HELPER FUNCTIONS ///////////////
///////////////////////////////////////////////

function broadcast(data, socketToOmit) {
  wsServer.clients.forEach(connectedSocket => {
    if (connectedSocket.readyState === WebSocket.OPEN && connectedSocket !== socketToOmit) {
      connectedSocket.send(data);
    }
  })
}

server.listen(PORT, () => {
  console.log(`Listening on: http://localhost:${server.address().port}`);
});

