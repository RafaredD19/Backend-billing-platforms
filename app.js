const express = require('express');
const cors = require('cors');
const app = express();
const billingRoutes = require('./src/modules/billing/billingRoutes');

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:8080', // Permitir el acceso desde tu aplicación frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Permite cookies u otros headers de autenticación
  optionsSuccessStatus: 200 // Algunos navegadores requieren status 200 para respuestas preflight
}));

// Configuración de middleware y rutas
app.use(express.json());
app.use('/api/v1', billingRoutes);

const PORT = process.env.PORT || 5030;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
