"use strict";
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const {StateUpdateRequest} = require('st-schema');
const {connector, deviceStates, accessTokens} = require('./app');

const PORT = process.env.PORT || 3000
const ACCESS_TOKEN_PREFIX = process.env.ACCESS_TOKEN_PREFIX;
const server = express();
server.use(express.json());
server.use(morgan(":method :url :status :response-time ms"));
connector.enableEventLogging(2);

server.post('/', (req, res) => {
  if (accessTokenIsValid(req)) {
    connector.handleHttpCallback(req, res)
  }
});

server.post('/command', (req, res) => {
  deviceStates[req.body.name] = req.body.value;
  for (const accessToken of Object.keys(accessTokens)) {
    const item = accessTokens[accessToken];
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
    updateRequest.updateState(item.callbackUrls, item.callbackAuthentication, deviceState)
  }
  res.send({});
  res.end()
});

function accessTokenIsValid(req) {
  // Replace with proper validation of issued access token
  if (req.body.authentication.token) {
    return true;
  }
  res.status(401).send('Unauthorized');
  return false;
}

server.listen(PORT);
console.log(`Server listening on http://127.0.0.1:${PORT}`);
