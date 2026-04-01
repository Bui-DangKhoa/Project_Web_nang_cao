const mongoose = require("mongoose");
const MyConstants = require("./MyConstants");

const uri =
  "mongodb+srv://" +
  MyConstants.DB_USER +
  ":" +
  MyConstants.DB_PASS +
  "@" +
  MyConstants.DB_SERVER +
  "/" +
  MyConstants.DB_DATABASE;

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(uri)
    .then(() => {
      console.log(
        "Connected to " + MyConstants.DB_SERVER + "/" + MyConstants.DB_DATABASE,
      );
    })
    .catch((err) => {
      console.error(err);
    });
}

module.exports = mongoose;