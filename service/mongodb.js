const { MongoClient } = require('mongodb');

const mongo = new MongoClient(process.env.MONGODB_URI);

async function saveMessage(message) {
  try {
    await mongo.connect((err) => console.log("Connected to the database!"));
    const chatHistory = mongo.db("chatDB").collection("chats");
    await chatHistory.insertOne(message);
  } catch (error) {
    console.error("Error saving message to database:", error);
  } finally {
    await mongo.close();
  }
}

async function getChatHistory() {
  try {
    await mongo.connect((err) => console.log("Connected to the database!"));
    const chatHistory = mongo.db("chatDB").collection("chats");
    const history = await chatHistory.find().toArray();
    return history;
  } catch (error) {
    console.error("Error getting chat history from database:", error);
  } finally {
    await mongo.close();
  }
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = exports = {
        saveMessage,
        getChatHistory
    };
}