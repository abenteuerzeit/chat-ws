import { PORT, CLIENT, SERVER } from './utils/constants.js';


////////////////////////////////////////////////
////////////// VARIABLES ///////////////////////
////////////////////////////////////////////////

// This variable will hold the WebSocket client connection. 
// Initialize in the init() function
let wsClient;
const username = prompt('enter a username');


////////////////////////////////////////////////
//////////////// DOM SETUP /////////////////////
////////////////////////////////////////////////

const messageBox = document.querySelector('#messageBox');
const messageForm = document.querySelector('#messageForm');

// Event handler when the client enters a message
messageForm.onsubmit = function (e) {
    e.preventDefault();

    // Get the message from the messageBox
    const message = messageBox.value;
    // Render the sent message on the client as your own and reset the messageBox
    showMessageSent(message);
    messageBox.value = '';

    sendMessageToServer(message);
}


////////////////////////////////////////////////
////////////// WS CLIENT LOGIC /////////////////
////////////////////////////////////////////////

function init() {

    /* Note: 
    Though the conditional block below is not necessary, it is a best practice to avoid
    tampering with a cluttered namespace.
    */

    // If a WebSocket connection exists already, close it
    if (wsClient) {
        wsClient.onerror = wsClient.onopen = wsClient.onclose = null;
        wsClient.close();
    }

    const URL = `ws://localhost:${PORT}`;
    wsClient = new WebSocket(URL);
    console.log(URL);

    wsClient.onopen = () => {
        console.log("Connection to the WebSocket server established!");
        const data = {
            type: CLIENT.MESSAGE.NEW_USER,
            payload: { username }
        }
        wsClient.send(JSON.stringify(data));
    }

    wsClient.onmessage = (messageEvent) => {
        const message = messageEvent.data;
        const { type, payload } = JSON.parse(message);
        switch (type) {
            case SERVER.BROADCAST.NEW_USER_WITH_TIME:
                showMessageReceived('<em>' + payload.username + ' has joined at ' + payload.time + ' !</em>')
                break;
            case CLIENT.MESSAGE.NEW_MESSAGE:
                showMessageReceived(`<strong>[${payload.username}]</strong> ${payload.message}`);
                break;
            default:
                break;
        }
    }


    /* Note:
    The event handlers below are useful for properly cleaning up a closed/broken WebSocket client connection.
    To read more about them, check out the WebSocket API documentation: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
    */

    // .onclose is executed when the socket connection is closed
    wsClient.onclose = (event) => {
        showMessageReceived('No WebSocket connection :(');
        wsClient = null;
    }

    // .onerror is executed when error event occurs on the WebSocket connection
    wsClient.onerror = (event) => {
        console.error("WebSocket error observed:", event);
        wsClient = null;
    }
}

function sendMessageToServer(message) {
    // Make sure the client is connected to the ws server
    if (!wsClient) {
        showMessageReceived('No WebSocket connection :(');
        return;
    }


    const data = {
        type: CLIENT.MESSAGE.NEW_MESSAGE,
        payload: { message, username }
    }
    wsClient.send(JSON.stringify(data));
}


////////////////////////////////////////////////
//////////// DOM HELPER FUNCTIONS //////////////
////////////////////////////////////////////////

const messages = document.querySelector('.chat');

// These functions are just aliases of the showNewMessage function
function showMessageSent(message) {
    showNewMessage(message, 'sending');
}
function showMessageReceived(message) {
    showNewMessage(message, 'receiving');
}


// This function displays a message in the messages container node. 
// className may either be 'mine' or 'yours' (see styles.css for the distinction)
function showNewMessage(message, className) {
    // Create a text node element for the message
    const textNode = document.createElement('div');
    textNode.innerHTML = message;
    textNode.className = 'message';

    // Wrap the text node in a message element
    const messageNode = document.createElement('div');
    messageNode.className = 'messages ' + className;
    messageNode.appendChild(textNode);

    // Append the messageNode to the messages container element
    messages.appendChild(messageNode);
    messages.scrollTop = messages.scrollHeight;
}

// Start the WebSocket server
init();
