const OpenAI = require("openai");
const CONSTANTS = require("../utils/constants.js");
const { CLIENT } = CONSTANTS;
const { saveMessage, getChatHistory } = require("./mongodb.js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function prompter() {
  const chatHistory = await getChatHistory();
  const messagesWithUserInfo = chatHistory.map((msg) => {
    const contentWithUserInfo = `[User: ${msg.userId}] ${msg.content}`;
    return {
      role: msg.role,
      content: contentWithUserInfo,
    };
  });

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messagesWithUserInfo,
  })
  return res.choices[0].message.content;
}

async function chatWithGPT(payload) {
  try {
    const res = await prompter();

    const gptPayload = {
      ...payload,
      message: res,
      username: "GPT-4",
    };

    saveMessage({
      role: "assistant",
      content: res,
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
  };
}
