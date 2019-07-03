const {SchemaConnector} = require('st-schema');
const deviceStates = {switch: 'off', level: 100};
const accessTokens = {};
const connector = new SchemaConnector()
  .clientId(process.env.ST_CLIENT_ID)
  .clientSecret(process.env.ST_CLIENT_SECRET)
  .discoveryHandler((accessToken, response) => {
    response.addDevice('external-device-1', 'Test Dimmer', 'c2c-dimmer')
  })
  .stateRefreshHandler((accessToken, response) => {
    response.addDevice('external-device-1', [
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: deviceStates.switch
      },
      {
        component: 'main',
        capability: 'st.switchLevel',
        attribute: 'level',
        value: deviceStates.level
      }
    ])
  })
  .commandHandler((accessToken, response, devices) => {
    for (const device of devices) {
      const deviceResponse = response.addDevice(device.externalDeviceId);
      for (const cmd of device.commands) {
        const state = {
          component: cmd.component,
          capability: cmd.capability
        };
        if (cmd.capability === 'st.switchLevel' && cmd.command === 'setLevel') {
          state.attribute = 'level';
          state.value = deviceStates.level = cmd.arguments[0];
          deviceResponse.addState(state);

        } else if (cmd.capability === 'st.switch') {
          state.attribute = 'switch';
          state.value = deviceStates.switch = cmd.command === 'on' ? 'on' : 'off';
          deviceResponse.addState(state);

        } else {
          deviceResponse.setError(
              `Command '${cmd.command} of capability '${cmd.capability}' not supported`,
              DeviceErrorTypes.CAPABILITY_NOT_SUPPORTED)
        }
      }
    }
  })
  .callbackAccessHandler(async (accessToken, callbackAuthentication, callbackUrls) => {
    accessTokens[accessToken] = {
      callbackAuthentication,
      callbackUrls
    }
    console.log(JSON.stringify(accessTokens, null, 2))
  })
  .integrationDeletedHandler(accessToken => {
    delete accessTokens[accessToken]
  });

module.exports = {
  connector: connector,
  deviceStates: deviceStates,
  accessTokens: accessTokens
};
