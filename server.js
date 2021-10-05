"use strict";

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const {StateUpdateRequest} = require('st-schema');
const {connector, deviceStates, accessTokens} = require('./app');
const db = require('./db')

const PORT = process.env.PORT || 3000
const ACCESS_TOKEN_PREFIX = process.env.ACCESS_TOKEN_PREFIX;
const server = express();
server.use(express.json());
server.use(morgan(":method :url :status :response-time ms"));
connector.enableEventLogging(2);

// Handles calls from SmartThings platform
server.post('/', (req, res) => {
  if (accessTokenIsValid(req, res)) {
    connector.handleHttpCallback(req, res)
  }
});

// Handles command execution to allow callbacks to be demonstrated
server.post('/command', async (req, res, next) => {
  try {
    deviceStates[req.body.name] = req.body.value;
    for (const item of db.getCallbacks()) {
      const updateRequest = new StateUpdateRequest(process.env.ST_CLIENT_ID, process.env.ST_CLIENT_SECRET);
      const deviceState = [
        {
          externalDeviceId: 'external-device-1',
          states: [
            {
              component: 'main',
              capability: req.body.name === 'level' ? 'st.switchLevel' : 'st.switch',
              attribute: req.body.name,
              value: req.body.value
            }
          ]
        }
      ];
      await updateRequest.updateState(item.callbackUrls, item.callbackAuthentication, deviceState)
    }
    res.send({});
  } catch (error) {
    console.error('Error processing command', error)
    res.status(error.status).send({message: error.message})
  }
});

function accessTokenIsValid(req, res) {
  // Replace with proper validation of issued access token
  if (req.body.authentication.token && req.body.authentication.token.startsWith(ACCESS_TOKEN_PREFIX)) {
    return true;
  }
  res.status(401).send('Unauthorized');
  return false;
}

server.listen(PORT);
console.log(`Server listening on http://127.0.0.1:${PORT}`);
