const express = require('express');
const WebSocket = require('ws');
const dialogflow = require('@google-cloud/dialogflow');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
  console.log(`HTTP server running at http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Replace with your Dialogflow project ID
const projectId = 'flightbookingbot-cdyx';

// Replace with your service account path
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: path.join(__dirname, 'service-account.json')
});

wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  const sessionId = uuidv4();
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: data.message,
            languageCode: 'en-US',
          },
        },
      };

      const [response] = await sessionClient.detectIntent(request);
      const reply = response.queryResult.fulfillmentText;

      ws.send(JSON.stringify({ reply }));
    } catch (error) {
      console.error('Error:', error);
      ws.send(JSON.stringify({ reply: 'Sorry, something went wrong.' }));
    }
  });
});
