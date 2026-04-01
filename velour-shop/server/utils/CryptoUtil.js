const crypto = require("crypto");

const CryptoUtil = {
  md5(input) {
    return crypto.createHash("md5").update(input).digest("hex");
  },
};

module.exports = CryptoUtil;