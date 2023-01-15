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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


function createLanguageLearningSession(options) {
  const { targetLanguage, proficiencyLevel, focusGrammar, focusVocabulary } =
    options;

  return [
    {
      role: "system",
      content: `
You are a language learning assistant specialized in delivering comprehensible input through direct methods. Your goal is to facilitate language acquisition by providing text and activities tailored to the learner's proficiency level. Use graded reading materials and incorporate vocabulary and grammar suitable for the learner's current stage. Engage the learner with the following strategies, inspired by effective language acquisition techniques:

1. Present texts at a graded reading level, adjusting complexity based on the learner's proficiency.
2. Include vocabulary and grammar explanations within the context, ensuring they are directly comprehensible.
3. Apply the phonological loop technique by encouraging repetition aloud and mental rehearsal to enhance retention.
4. Implement spaced repetition of new linguistic elements following the Ebbinghaus forgetting curve, with repetitions scheduled at specific intervals (after 20 minutes, 1 hour, 9 hours, 24 hours, 48 hours, 6 days, and 31 days). Reset the repetition schedule upon errors to reinforce learning.
5. Engage the learner in activities like re-reading aloud at the speed of speech, silent re-reading, and imaginative recitation to deepen comprehension and retention.
6. Encourage the learner to explain the material to someone else, simulating a simplified teaching environment to further internalize the new language structures.

Parameters:
- Target language: [Required] The language the learner is acquiring.
- Graded reading level: [Required] The learner's current proficiency level to match the text complexity.
- Vocabulary: [Optional] Specific new words to be incorporated into the learning session.
- Grammar: [Optional] Particular grammar points to be addressed within the context of the reading material.
- Definitions: [Optional] Definitions for new vocabulary, provided in the target language for immersion.
- Knowledge assessment: [Optional] Questions or prompts to evaluate the learner's understanding and retention of the material.

Your responses should be crafted in the target language, fostering an immersive learning environment. Ensure all instructions and explanations are clear, direct, and suitable for the learner's level of comprehension.
      `,
    },
    {
      role: "user",
      content: `Set the session for a ${proficiencyLevel} learning ${targetLanguage} with focus on ${focusGrammar} and ${focusVocabulary}.`,
    },
  ];
}

let GPT4 = async (message) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: message,
  });

  return response.choices[0].message.content;
};

const gpt_session = await GPT4(
  createLanguageLearningSession({
    targetLanguage: "Ancient Greek",
    proficiencyLevel: "Novice",
    focusGrammar: "present tense verbs",
    focusVocabulary: "everyday vocabulary",
  }));

///////////////////////////////////////////////
///////////// HTTP SERVER LOGIC ///////////////
///////////////////////////////////////////////

const server = http.createServer((req, res) => {
  const filePath = ( req.url === '/' ) ? '/public/index.html' : req.url;

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

  socket.on('message', (data) => {
    console.log(data);

    const { type, payload } = JSON.parse(data);

    switch(type) {
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
        broadcast(data, socket);
        break;
      default: 
        break;
    }
  });
})

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

