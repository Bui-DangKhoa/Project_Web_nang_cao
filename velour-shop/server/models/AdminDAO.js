require("../utils/MongooseUtil");
const Models = require("./Models");

const AdminDAO = {
  async selectByUsernameAndPassword(username, password) {
    const query = { username, password };
    const admin = await Models.Admin.findOne(query);
    return admin;
  },
};

module.exports = AdminDAO;