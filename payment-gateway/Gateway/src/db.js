import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { DATABASE_URL } = process.env;

let pool;

// Adaptador: mantiene la interfaz de mysql2 (`?` como parámetro y resultado [rows])
// para que las rutas no cambien al usar Postgres.
function wrap(pgPool) {
  return {
    async query(sql, params = []) {
      let i = 0;
      const text = sql.replace(/\?/g, () => `$${++i}`);
      const result = await pgPool.query(text, params);
      return [Object.assign(result.rows, { affectedRows: result.rowCount })];
    }
  };
}

export async function initDB() {
  try {
    pool = wrap(new pg.Pool({ connectionString: DATABASE_URL, max: 10 }));

    // Crear tabla si no existe
    const createSql = `CREATE TABLE IF NOT EXISTS pagos (
      id CHAR(36) PRIMARY KEY,
      "fechaRegistro" TIMESTAMP NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      estado VARCHAR(20) NOT NULL,
      "fechaPago" TIMESTAMP NULL
    );`;

    await pool.query(createSql);
    console.log('Tabla pagos verificada.');
  } catch (err) {
    console.error('Error inicializando DB:', err.message);
    throw err;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Pool de DB no inicializado. Llama initDB primero.');
  }
  return pool;
}
