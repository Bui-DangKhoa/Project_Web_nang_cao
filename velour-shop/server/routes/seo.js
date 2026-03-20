const router = require("express").Router();
const SeoSetting = require("../models/SeoSetting");

const getOrCreateSetting = async () => {
  let setting = await SeoSetting.findOne({ key: "default" });
  if (!setting) {
    setting = await SeoSetting.create({ key: "default" });
  }
  return setting;
};

// Public SEO config endpoint used by storefront.
router.get("/settings", async (req, res) => {
  const setting = await getOrCreateSetting();
  return res.json(setting);
});

module.exports = router;
