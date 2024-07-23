import express from 'express';
import pool from './database/db.js';
import morgan from 'morgan';

const app = express();

// Middlewares
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static('public'));

// Devuelve la aplicación cliente
app.get('/', (req, res) => {
    res.sendFile("index.html");
});

// Crear usuario
app.post('/usuario', async (req, res) => {
    const { nombre, balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *',
            [nombre, balance]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar un usuario
app.delete('/usuario', async (req, res) => {
    let { id } = req.query;
    try {
        let result = await pool.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING *',
            [id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar un usuario
app.put('/usuario', async (req, res) => {
    let { id, nombre, balance } = req.body;
    try {
        let result = await pool.query(
            "UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING id, nombre, balance",
            [nombre, balance, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    try {
        let result = await pool.query('SELECT * FROM usuarios');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Realizar una transferencia
app.post('/transferencia', async (req, res) => {
    const { emisor, receptor, monto } = req.body;
    try {
        //Inicio
        await pool.query('BEGIN');

        //Descontar el dinero del emisor
        await pool.query('UPDATE usuarios SET balance = balance - $1 WHERE id = $2', [monto, emisor]);

        //Agregar el dinero al receptor
        await pool.query('UPDATE usuarios SET balance = balance + $1 WHERE id = $2', [monto, receptor]);

        //Registrar la transferencia
        await pool.query('INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, NOW())', [emisor, receptor, monto]);

        //Confirmar la transacción
        await pool.query('COMMIT');

        res.status(201).json({ message: 'Transferencia realizada con éxito' });
    } catch (err) {
        await pool.query('ROLLBACK');

        if (err.code === '23514') {
            res.status(400).json({ message: 'La cuenta del emisor no tiene saldo suficiente' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Obtener todas las transferencias
app.get('/transferencias', async (req, res) => {
    try {
        let result = await pool.query('SELECT * FROM transferencias');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log(`Servidor corriendo en http://localhost:3000`);
});
