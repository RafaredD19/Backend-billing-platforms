const billingService = require('./billingService');

const uploadExcel = async (req, res) => {
  try {
    const results = await billingService.processExcel(req.file);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error processing file', error: error.message });
  }
};

module.exports = {
  uploadExcel
};
