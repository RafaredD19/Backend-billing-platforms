const billingService = require('./billingService');

const uploadExcel = async (req, res) => {
  try {
    // Aquí se procesaría el archivo Excel recibido en req.file
    const result = await billingService.processExcel(req.file);
    // console.log(result);  // Imprimir el payload en consola
    res.status(200).json({ message: 'File processed successfully', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Error processing file', error: error.message });
  }
};

module.exports = {
  uploadExcel
};
