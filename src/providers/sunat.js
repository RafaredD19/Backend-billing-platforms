const axios = require('axios');

// Caché para almacenar los datos recuperados y evitar solicitudes repetidas
const cache = {};

const getClientInfo = async (ruc) => {
  if (cache[ruc]) {
    // Si los datos del RUC están en la caché, retornarlos
    console.log(`Using cached data for RUC: ${ruc}`);
    return cache[ruc];
  }

  try {
    const response = await axios.get(`https://api.apis.net.pe/v1/ruc?numero=${ruc}`);
    const data = response.data;
    cache[ruc] = data; // Almacenar los datos en la caché
    return data;
  } catch (error) {
    console.error(`Error fetching data for RUC: ${ruc}`, error.response ? error.response.data : error.message);
    throw error;
  }
};

module.exports = {
  getClientInfo
};
