const xlsx = require('xlsx');
const axios = require('axios');
const { getClientInfo } = require('../../providers/sunat');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const formatDate = (dateStr) => {
  if (!dateStr) return null; // Verificar que dateStr no sea nulo o indefinido
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  if (!date) return null; // Verificar que date no sea nulo o indefinido
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

  const results = [];

  for (const item of data) {
    let ruc = item.RUC ? item.RUC.toString() : '';
    let clienteTipoDocumento = '6';
    let clienteNumeroDocumento = ruc.padStart(11, '0'); // RUC con ceros iniciales

    if (ruc.length === 8) {
      // Si el RUC tiene 8 dígitos, se considera un DNI
      clienteTipoDocumento = '1';
    }

    const fechaEmision = formatDate(item['F. EMISION']);
    const fechaVencimiento = fechaEmision ? addDays(fechaEmision, 15) : null;

    let datos_del_cliente_o_receptor = {
      codigo_tipo_documento_identidad: clienteTipoDocumento,
      numero_documento: clienteNumeroDocumento,
      apellidos_y_nombres_o_razon_social: item["RAZON SOCIAL"] || '',
      codigo_pais: 'PE',
      ubigeo: '',
      direccion: '',
      correo_electronico: '',
      telefono: ''
    };

    if (clienteTipoDocumento === '6' && !processedRUCs.has(clienteNumeroDocumento)) {
      try {
        const clientInfo = await getClientInfo(clienteNumeroDocumento);
        datos_del_cliente_o_receptor = {
          ...datos_del_cliente_o_receptor,
          ubigeo: clientInfo.ubigeo || '',
          direccion: clientInfo.direccion || ''
        };
        cache[clienteNumeroDocumento] = datos_del_cliente_o_receptor; // Almacenar en caché
        processedRUCs.add(clienteNumeroDocumento); // Marcar RUC como procesado
      } catch (error) {
        console.error(`Failed to fetch data for RUC: ${clienteNumeroDocumento}`, error);
      }
    } else if (processedRUCs.has(clienteNumeroDocumento)) {
      datos_del_cliente_o_receptor = cache[clienteNumeroDocumento];
    }

    // Cálculo de los totales
    const totalGravadas = parseFloat(item.PRECIO) * parseFloat(item['FACT. ACTUAL']);
    const totalTax = parseFloat((totalGravadas * 0.18).toFixed(2));
    const totalVenta = parseFloat((totalGravadas + totalTax).toFixed(2));

    const totales = {
      total_exportacion: parseFloat((0).toFixed(2)),
      total_operaciones_gravadas: parseFloat(totalGravadas.toFixed(2)),
      total_operaciones_inafectas: parseFloat((0).toFixed(2)),
      total_operaciones_exoneradas: parseFloat((0).toFixed(2)),
      total_operaciones_gratuitas: parseFloat((0).toFixed(2)),
      total_igv: totalTax,
      total_impuestos: totalTax,
      total_valor: parseFloat(totalGravadas.toFixed(2)),
      total_venta: totalVenta
    };

    // Construcción del objeto "items"
    const items = [{
      codigo_interno: item['COD. PROD.'] || '',
      descripcion: item['DESCRIPCION'] || '',
      codigo_producto_sunat: item['COD. PROD.'] || '',
      unidad_de_medida: "NIU",
      cantidad: parseFloat(item['FACT. ACTUAL']),
      valor_unitario: parseFloat(item.PRECIO),
      codigo_tipo_precio: "01",
      precio_unitario: parseFloat((item.PRECIO * 1.18)),
      codigo_tipo_afectacion_igv: "10",
      total_base_igv: parseFloat(totalGravadas.toFixed(2)),
      porcentaje_igv: 18,
      total_igv: totalTax,
      total_impuestos: totalTax,
      total_valor_item: parseFloat(totalGravadas.toFixed(2)),
      total_item: totalVenta
    }];

    // Construcción del objeto "venta_al_credito"
    const venta_al_credito = [{
      cuota: "Cuota001",
      fecha_de_pago: fechaVencimiento,
      importe: parseFloat(totalVenta)
    }];

    const documentData = {
      tipo_documento: "01",
      serie_documento: "F001",
      numero_documento: item['#'], // Supuesto número de factura o similar
      fecha_de_emision: fechaEmision,
      hora_de_emision: "10:10:10",
      codigo_tipo_operacion: "0101",
      codigo_tipo_documento: "01",
      codigo_tipo_moneda: "PEN",
      fecha_de_vencimiento: fechaVencimiento,
      numero_orden_de_compra: "",
      nombre_almacen: "XX",
      additional_information: "",
      datos_del_emisor: {
        codigo_establecimiento: "0001"
      },
      datos_del_cliente_o_receptor,
      totales,
      items,
      termino_de_pago: {
        descripcion: "Credito",
        tipo: "1"
      },
      venta_al_credito,
      acciones: {
        enviar_xml_firmado: "false"
      }
    };

    try {
      const response = await axios.post('https://20507977759.sys4fact.com/api/documents', documentData, {
        headers: {
          'Authorization': 'Bearer gqdb4GsVl46UyS69f6wWHYFcdEKJDbebn9gIzLAQb03NqsG7vv',
          'Content-Type': 'application/json'
        }
      });
      results.push(response.data);
    } catch (error) {
      results.push({ error: error.response ? error.response.data : error.message });
    }

    await delay(500); // Esperar 0.5 segundos antes de la próxima solicitud
  }

  return results;
};

module.exports = {
  processExcel
};
