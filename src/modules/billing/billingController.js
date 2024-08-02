const billingService = require('./billingService');
const moment = require('moment-timezone');
const uploadExcel = async (req, res) => {
  try {
    const results = await billingService.processExcel(req.file);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error processing file', error: error.message });
  }
};

const getFacturas = async (req, res) => {
  try {
    const today = moment().tz('America/Lima').format('YYYY-MM-DD'); // Obtener la fecha de hoy en formato YYYY-MM-DD en UTC-5
    const facturas = await billingService.getFacturas(today);
    const formattedFacturas = facturas.map(factura => ({
      ...factura,
      time: moment(factura.time).tz('America/Lima').format('DD-MM-YYYY HH:mm:ss')
    }));
    res.status(200).json({ data: formattedFacturas });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving facturas', error: error.message });
  }
};
module.exports = {
  uploadExcel,
  getFacturas  
};
