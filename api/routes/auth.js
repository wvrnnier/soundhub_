const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');

// Conexión a Neon
const sql = neon(process.env.SHDB_DATABASE_URL);

// REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { email, username, password, gender, birthYear, newsletter } = req.body;

        // Comprobar si el usuario ya existe en la DB
        const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
        
        if (existingUser.length > 0){
            return res.status(409).json({ message: 'El usuario ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar en Neon
        const [newUser] = await sql`
            INSERT INTO users (email, username, password, gender, birth_year, newsletter)
            VALUES (${email}, ${username}, ${hashedPassword}, ${gender}, ${birthYear}, ${newsletter})
            RETURNING id, email, username, gender, birth_year as "birthYear", newsletter, profile_image_url as "profileImageUrl"
        `;

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Usuario registrado con éxito',
            token,
            user: newUser    
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el registro' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar en la DB
        const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const validPass = await bcrypt.compare(password, user.password);
        
        if (!validPass) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },  
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Obtener las listas del usuario
        const userLists = await sql`
            SELECT id, list_name as "listName", date as "createdAt"
            FROM user_lists 
            WHERE user_id = ${user.id}
            ORDER BY date DESC
        `;

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                gender: user.gender,
                birthYear: user.birth_year,
                newsletter: user.newsletter,
                profileImageUrl: user.profile_image_url,
                userLists
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;