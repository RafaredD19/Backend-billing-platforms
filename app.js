const express = require('express');
const app = express();
const billingRoutes = require('./src/modules/billing/billingRoutes');

// Configuración de middleware y rutas
app.use(express.json());
app.use('/api/v1', billingRoutes);

const PORT = process.env.PORT || 3080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
