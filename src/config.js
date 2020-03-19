const mode = process.env.NODE_ENV || "production";
const config = require("./config.json")[mode];

module.exports = config;
