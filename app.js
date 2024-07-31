const express = require('express');
const app = express();
const pool = require('./src/config/database');

// Tu lógica de servidor y rutas aquí

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
