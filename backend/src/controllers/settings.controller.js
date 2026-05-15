const Settings = require('../models/Settings');

async function getPublicSettings(_req, res, next) {
  try {
    const doc = await Settings.getSingleton();
    res.json({
      data: {
        maintenanceMode: doc.maintenanceMode,
        maintenanceMessage: doc.maintenanceMessage,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublicSettings };
