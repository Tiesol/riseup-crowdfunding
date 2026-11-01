import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import QRCode from 'qrcode';
import { getPool } from '../db.js';

const router = Router();

// Crear pago
router.post('/', async (req, res) => {
  try {
    const { monto } = req.body;
    if (monto == null) {
      return res.status(400).json({ error: 'monto es requerido' });
    }
    const id = uuid();
    const fechaRegistro = new Date();
    const estado = 'PENDING';

    const sql = 'INSERT INTO pagos (id, "fechaRegistro", monto, estado, "fechaPago") VALUES (?,?,?,?,?)';
    const params = [
      id,
      formatDateTime(fechaRegistro),
      monto,
      estado,
      null
    ];
    const publicUrl = process.env.PUBLIC_URL || '';
    const pool = getPool();
    await pool.query(sql, params);
    res.status(201).json({ id, estado, qr :  `${publicUrl}payments/qr/${id}` });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'identifier ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error creando pago' });
  }
});

// Confirmar pago
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const fechaPago = new Date();
    const estado = 'CONFIRMED';
    console.log(`Confirmando pago ${id} a las ${fechaPago.toISOString()}`);

    const pool = getPool();
    const [result] = await pool.query('UPDATE pagos SET estado=?, "fechaPago"=? WHERE id=?', [estado, formatDateTime(fechaPago), id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const confirmationHookEndpoint = process.env.CONFIRMATION_HOOK_ENDPOINT || '';
    if (confirmationHookEndpoint) {
      const pago = { id, fechaPago };
      console.log(`Notificando hook de confirmación en ${confirmationHookEndpoint} para pago ${id}`);
      const response = await fetch(confirmationHookEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pago)
      });
      if (!response.ok) {
        const error = await response.text();
        console.error(`Error notificando hook de confirmación: HTTP ${response.status} ${error}`);
      }
    }

    const pago = await fetchById(pool, id);
    res.json(pago);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error confirmando pago' });
  }
});

// Obtener pago por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const pago = await fetchById(pool, id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(pago);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error consultando pago' });
  }
});

// Generar código QR con el ID del pago a partir del identifier
router.get('/qr/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM pagos WHERE id=?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const pago = deserialize(rows[0]);
    const qrBuffer = await QRCode.toBuffer(pago.id, { type: 'png' });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${pago.id}.png"`);
    res.send(qrBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando código QR' });
  }
});

function formatDateTime(date) {
  // YYYY-MM-DD HH:MM:SS
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function fetchById(pool, id) {
  const [rows] = await pool.query('SELECT * FROM pagos WHERE id=?', [id]);
  if (rows.length === 0) return null;
  return deserialize(rows[0]);
}

function deserialize(row) {
  return {
    id: row.id,
    fechaRegistro: row.fechaRegistro,
    monto: Number(row.monto),
    estado: row.estado,
    fechaPago: row.fechaPago,
    identifier: row.identifier
  };
}

export default router;
