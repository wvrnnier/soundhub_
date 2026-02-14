const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');
const { del } = require('@vercel/blob');
const authenticateToken = require('../middleware/auth');

const sql = neon(process.env.SHDB_DATABASE_URL);

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET - Obtener perfil del usuario autenticado
router.get('/profile', async (req, res) => {
    try {
        const [user] = await sql`
            SELECT id, username, email, gender, birth_year as "birthYear", newsletter, profile_image_url as "profileImageUrl"
            FROM users 
            WHERE id = ${req.user.id}
        `;

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
});

// PUT - Actualizar perfil del usuario (username, email, password, newsletter)
router.put('/profile', async (req, res) => {
    try {
        const { username, email, password, newsletter } = req.body;

        // Si se envía una nueva contraseña, hashearla
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [updatedUser] = await sql`
                UPDATE users 
                SET username = ${username}, 
                    email = ${email}, 
                    password = ${hashedPassword}, 
                    newsletter = ${newsletter}
                WHERE id = ${req.user.id}
                RETURNING id, username, email, gender, birth_year as "birthYear", newsletter, profile_image_url as "profileImageUrl"
            `;
            return res.json({ 
                message: 'Perfil actualizado con éxito',
                user: updatedUser 
            });
        }

        // Sin cambio de contraseña
        const [updatedUser] = await sql`
            UPDATE users 
            SET username = ${username}, 
                email = ${email}, 
                newsletter = ${newsletter}
            WHERE id = ${req.user.id}
            RETURNING id, username, email, gender, birth_year as "birthYear", newsletter, profile_image_url as "profileImageUrl"
        `;

        res.json({ 
            message: 'Perfil actualizado con éxito',
            user: updatedUser 
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error al actualizar perfil' });
    }
});

// DELETE - Eliminar cuenta del usuario
router.delete('/account', async (req, res) => {
    try {
        const { password } = req.body;

        const [user] = await sql`SELECT password, profile_image_url FROM users WHERE id = ${req.user.id}`;

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Cascada manual: songs_list → user_lists → users
        // 1. Obtener los IDs de las listas del usuario
        const userLists = await sql`SELECT id FROM user_lists WHERE user_id = ${req.user.id}`;
        const listIds = userLists.map(l => l.id);

        // 2. Eliminar canciones de songs_list asociadas a esas listas
        if (listIds.length > 0) {
            await sql`DELETE FROM songs_list WHERE list_id = ANY(${listIds})`;
        }

        // 3. Eliminar las listas del usuario
        await sql`DELETE FROM user_lists WHERE user_id = ${req.user.id}`;

        // 4. Eliminar el usuario
        await sql`DELETE FROM users WHERE id = ${req.user.id}`;

        // 5. Borrar avatar del Blob de Vercel (si existía)
        if (user.profile_image_url && user.profile_image_url.includes('blob.vercel-storage.com')) {
            try {
                await del(user.profile_image_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            } catch (e) {
                console.warn('No se pudo borrar el avatar del blob:', e.message);
            }
        }

        res.json({ message: 'Cuenta eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({ message: 'Error al eliminar cuenta' });
    }
});

module.exports = router;