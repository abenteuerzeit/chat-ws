const OpenAI = require("openai");
const { CLIENT } = require("../utils/constants.js");
const { saveMessage, getChatHistory } = require("./mongodb.js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function removeAssistantTag(response) {
  const assistantTag = "[Assistant]: ";
  return response.includes(assistantTag)
    ? response.replace(assistantTag, "")
    : response;
}

async function prompterAsync() {
  const chatHistory = await getChatHistory();
  const messagesForGPT = chatHistory.map((msg) => {
    const content =
      msg.role !== "assistant"
        ? `[${msg.userId}]: ${msg.content}`
        : `${msg.content}`;
    return {
      role: msg.role,
      content: content,
    };
  });

  console.log("Input for GPT-4:", messagesForGPT);

  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_NAME,
    messages: messagesForGPT,
  });
  return res.choices[0].message.content;
}


async function greetUserAsync(data) {
  const { username, time } = data;
  const greeting = `[${username}]: I joined the chatroom at ${time}.`;

  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_NAME,
    messages: [
      {
        role: "user",
        content: greeting,
      },
    ],
  });

  const content = res.choices[0].message.content;
  await saveMessage({
    role: "assistant",
    content: content,
    userId: "ChatRoomGPT",
    timestamp: time,
  });

  return content;
}

async function chatGptAsync(payload) {
  try {
    const res = await prompterAsync();

    await saveMessage({
      role: "assistant",
      content: res,
      userId: "ChatRoomGPT",
      timestamp: payload.time,
    });

    const gptPayload = {
      ...payload,
      message: removeAssistantTag(res),
      username: "ChatRoomGPT",
    };

    const data = {
      type: CLIENT.MESSAGE.NEW_MESSAGE,
      payload: gptPayload,
    };
    return data;
  } catch (error) {
    console.error("Error getting response from GPT-4:", error);
    return JSON.stringify({ type: CLIENT.MESSAGE.NEW_MESSAGE, error });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = exports = {
    chatWithGPTAsync: chatGptAsync,
    greetUserAsync: greetUserAsync,
  };
}
