const OpenAI = require("openai");
const CONSTANTS = require("../utils/constants.js");
const { CLIENT } = CONSTANTS;

let chatHistory = [];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function prompter(store = chatHistory) {
  const messagesWithUserInfo = store.map((msg) => {
    const contentWithUserInfo = `[User: ${msg.userId}] ${msg.content}`;
    return {
      role: msg.role,
      content: contentWithUserInfo,
    };
  });

  return await openai.chat.completions.create({
    model: "gpt-4",
    messages: messagesWithUserInfo,
  }).choices[0].message.content;
}

async function chatWithGPT(payload) {
  try {
    const gptResponse = await prompter(chatHistory);

    const gptPayload = {
      ...payload,
      message: gptResponse,
      username: "GPT-4",
    };

    chatHistory.push({
      role: "assistant",
      content: gptResponse,
      userId: "GPT-4",
    });

    return JSON.stringify({
      type: CLIENT.MESSAGE.NEW_MESSAGE,
      payload: gptPayload,
    });
    
  } catch (error) {
    console.error("Error getting response from GPT-4:", error);
    return JSON.stringify({ type: CLIENT.MESSAGE.NEW_MESSAGE, error });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = exports = {
    chatWithGPT,
    chatHistory,
  };
}
