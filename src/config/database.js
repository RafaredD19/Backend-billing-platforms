require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10, // Número máximo de conexiones en el pool
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the MySQL database.');
  connection.release(); // Liberar la conexión de nuevo al pool
});

module.exports = pool;
