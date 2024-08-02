const express = require('express');
const multer = require('multer');
const billingController = require('./billingController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Usar memoria para almacenamiento temporal

router.post('/upload', upload.single('file'), billingController.uploadExcel);

router.get('/facturas', billingController.getFacturas);

module.exports = router;
    