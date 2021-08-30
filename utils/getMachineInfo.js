const axios = require("axios");
const https = require("https");

const {MACHINE_URL} = require('../config');

const machineRequest = axios.create({
  httpsAgent: new https.Agent*({
    rejectUnauthorized: false
  })
});
machineRequest.defaults.baseURL = MACHINE_URL;
machineRequest.interceptors.request.use((config) => {
  return config;
}, function (error) {
  return Promise.reject(error);
});

module.exports = {
  machineRequest,
  getMachineInfo
};