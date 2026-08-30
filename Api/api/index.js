//? index.js para vercel
// api/index.js
const app = require("../index.js");

module.exports = (req, res) => {
  return app(req, res);
};
