const xlsx = require('xlsx');
const { getClientInfo } = require('../../providers/sunat');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const formatDate = (dateStr) => {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

const processExcel = async (file) => {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  const secondSheetName = workbook.SheetNames[1];
  const worksheet = workbook.Sheets[secondSheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const cache = {}; // Caché para almacenar datos de los RUC consultados
  const processedRUCs = new Set(); // Set para almacenar RUCs ya procesados
  const updatedData = [];

  for (const item of data) {
    let ruc = item.RUC.toString();
    let clienteTipoDocumento = '6';
    let clienteNumeroDocumento = ruc.padStart(11, '0'); // RUC con ceros iniciales

    if (ruc.length === 8) {
      // Si el RUC tiene 8 dígitos, se considera un DNI
      clienteTipoDocumento = '1';
    }

    const fechaEmision = formatDate(item['F. EMISION']);
    const fechaVencimiento = addDays(fechaEmision, 15);

    let cliente = {
      cliente_tipo_documento: clienteTipoDocumento,
      cliente_numero_documento: clienteNumeroDocumento,
      cliente_denominacion: item["RAZON SOCIAL"],
      codigo_pais: 'PE',
      ubigeo: '',
      cliente_direccion: '',
      cliente_email: '',
      cliente_telefono: ''
    };

    if (clienteTipoDocumento === '6' && !processedRUCs.has(clienteNumeroDocumento)) {
      try {
        const clientInfo = await getClientInfo(clienteNumeroDocumento);
        console.log(`Fetched data for RUC: ${clienteNumeroDocumento}`, clientInfo);

        cliente = {
          ...cliente,
          ubigeo: clientInfo.ubigeo || '',
          cliente_direccion: clientInfo.direccion || ''
        };

        cache[clienteNumeroDocumento] = cliente; // Almacenar en caché
        processedRUCs.add(clienteNumeroDocumento); // Marcar RUC como procesado
      } catch (error) {
        console.error(`Failed to fetch data for RUC: ${clienteNumeroDocumento}`, error);
      }
    } else if (processedRUCs.has(clienteNumeroDocumento)) {
      cliente = cache[clienteNumeroDocumento];
    }

    updatedData.push({
      tipo_documento: "01",
      serie: "F001",
      numero: item['#'], // Supuesto número de factura o similar
      tipo_operacion: "0101",
      fecha_de_emision: fechaEmision,
      hora_de_emision: "",
      moneda: item.MON,
      fecha_de_vencimiento: fechaVencimiento,
      enviar_automaticamente_al_cliente: true,
      datos_del_emisor: {
        codigo_establecimiento: "0000"
      },
      cliente
    });

    await delay(500); // Esperar 1 segundo antes de la próxima solicitud
  }

  return updatedData;
};

module.exports = {
  processExcel
};
