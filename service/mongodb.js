const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

let dbConnection;

async function connectToDatabaseAsync() {
  if (!dbConnection) {
    try {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      dbConnection = client.db("chatDB");
      console.log("Connected to the database!");
    } catch (error) {
      console.error("Could not connect to db", error);
      client.close();
      process.exit(1);
    }
  }
  return dbConnection;
}

async function saveMessageAsync(message) {
  try {
    const db = await connectToDatabaseAsync();
    const chatHistory = db.collection("chats");
    await chatHistory.insertOne(message);
    console.log("Message saved");
  } catch (error) {
    console.error("Error saving message to database:", error);
  }
}

async function getChatHistoryAsync() {
  try {
    const db = await connectToDatabaseAsync();
    const chatHistory = db.collection("chats");
    const history = await chatHistory.find().toArray();
    return history;
  } catch (error) {
    console.error("Error getting chat history from database:", error);
  }
}

async function clearChatHistoryAsync() {
  try {
    const db = await connectToDatabaseAsync();
    const chatHistory = db.collection("chats");
    await chatHistory.deleteMany({});
    console.log("Chat history cleared");
  } catch (error) {
    console.error("Error clearing chat history from database:", error);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = exports = {
    saveMessage: saveMessageAsync,
    getChatHistory: getChatHistoryAsync,
    clearChatHistory: clearChatHistoryAsync,
  };
}
