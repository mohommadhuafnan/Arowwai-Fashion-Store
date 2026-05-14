const Settings = require('../models/Settings.model');

const DEFAULT_SETTINGS = [
  { key: 'currency', value: 'LKR', category: 'general', description: 'Default currency' },
  { key: 'tax_rate', value: 18, category: 'general', description: 'Default tax rate (%)' },
  { key: 'language', value: 'en', category: 'general', description: 'Default language' },
  { key: 'company_name', value: 'Fashion Mate', category: 'invoice', description: 'Company name on invoices' },
  { key: 'invoice_prefix', value: 'FM', category: 'invoice', description: 'Invoice number prefix' },
  { key: 'loyalty_points_rate', value: 1, category: 'loyalty', description: 'Points per 100 currency' },
];

const getSettings = async (req, res) => {
  const settings = await Settings.find();
  res.json({ success: true, data: settings });
};

const updateSetting = async (req, res) => {
  const setting = await Settings.findOneAndUpdate(
    { key: req.params.key },
    { value: req.body.value },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: setting });
};

const seedSettings = async (req, res) => {
  for (const s of DEFAULT_SETTINGS) {
    await Settings.findOneAndUpdate({ key: s.key }, s, { upsert: true });
  }
  const settings = await Settings.find();
  res.json({ success: true, data: settings });
};

module.exports = { getSettings, updateSetting, seedSettings };
