const http = require("http");
const CONSTANTS = require("./utils/constants.js");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { greetUserAsync, chatWithGPTAsync } = require("./service/openai.js");
const { saveMessage, clearChatHistory } = require("./service/mongodb.js");

const { PORT, CLIENT, SERVER } = CONSTANTS;

const server = http.createServer((req, res) => {
  const filePath = req.url === "/" ? "/public/index.html" : req.url;

  // determine the contentType by the file extension
  const extname = path.extname(filePath);
  let contentType = "text/html";
  if (extname === ".js") contentType = "text/javascript";
  else if (extname === ".css") contentType = "text/css";

  // pipe the proper file to the res object
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(`${__dirname}/${filePath}`, "utf8").pipe(res);
});

const wsServer = new WebSocket.Server({ server });

wsServer.on("connection", (socket) => {
  console.log("A new client has connected to the server! :)");

  socket.on("message", async (data) => {
    console.log(data);

    const { type, payload } = JSON.parse(data);
    const timestamp = new Date().toLocaleString();

    switch (type) {

      case CLIENT.MESSAGE.NEW_USER:
        payload.time = timestamp;
        const dataWithTime = {
          type: SERVER.BROADCAST.NEW_USER_WITH_TIME,
          payload,
        };
        broadcast(JSON.stringify(dataWithTime));
        break;

      case CLIENT.MESSAGE.GREETING:
        const greeting = {
          type: SERVER.BROADCAST.GREETING,
          payload: {
            message: await greetUserAsync(payload),
            username: "ChatRoomGPT",
          },
        };
        broadcast(JSON.stringify(greeting));
        break;

      case CLIENT.MESSAGE.NEW_MESSAGE:
        saveMessage({
          role: "user",
          content: payload.message,
          userId: payload.username,
          timestamp: payload.time,
        });
        broadcast(data, socket);
        broadcast(JSON.stringify(await chatWithGPTAsync(payload)));

      default:
        console.log("Unknown message type:", type);
        break;
    }
  });
});

function broadcast(data, socketToOmit) {
  wsServer.clients.forEach((connectedSocket) => {
    if (
      connectedSocket.readyState === WebSocket.OPEN &&
      connectedSocket !== socketToOmit
    ) {
      connectedSocket.send(data);
    }
  });
}

server.listen(PORT, () => {
  clearChatHistory();
  console.log(`Listening on: http://localhost:${server.address().port}`);
});
