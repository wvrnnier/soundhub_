const express = require('express');
const router = express.Router();
const { put, del } = require('@vercel/blob');
const { neon } = require('@neondatabase/serverless');
const authenticateToken = require('../middleware/auth');

const sql = neon(process.env.SHDB_DATABASE_URL);

router.use(authenticateToken);

// Tipos MIME permitidos y sus magic bytes
const ALLOWED_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/webp': null, // se valida aparte (RIFF...WEBP)
  'image/gif':  [0x47, 0x49, 0x46],
};

function isValidImage(buffer, contentType) {
  if (!ALLOWED_TYPES.hasOwnProperty(contentType)) return false;

  if (contentType === 'image/webp') {
    // RIFF....WEBP
    return buffer.length > 12
      && buffer[0] === 0x52 && buffer[1] === 0x49
      && buffer[2] === 0x46 && buffer[3] === 0x46
      && buffer[8] === 0x57 && buffer[9] === 0x45
      && buffer[10] === 0x42 && buffer[11] === 0x50;
  }

  const magic = ALLOWED_TYPES[contentType];
  if (!magic) return false;
  return magic.every((byte, i) => buffer[i] === byte);
}

// POST /api/avatar/upload — Subir imagen de perfil al Blob de Vercel
router.post('/upload', express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ message: 'No se ha enviado ninguna imagen' });
    }

    const contentType = req.headers['content-type'];

    // Validar content-type contra lista blanca
    if (!ALLOWED_TYPES.hasOwnProperty(contentType)) {
      return res.status(400).json({ message: 'Tipo de imagen no permitido. Solo JPEG, PNG, WebP o GIF' });
    }

    // Validar magic bytes del archivo
    if (!isValidImage(req.body, contentType)) {
      return res.status(400).json({ message: 'El archivo no es una imagen válida' });
    }

    const extension = contentType.split('/')[1] || 'png';
    const filename = `avatars/${req.user.id}-${Date.now()}.${extension}`;

    // Obtener la URL anterior para borrarla después
    const [currentUser] = await sql`
      SELECT profile_image_url FROM users WHERE id = ${req.user.id}
    `;

    // Subir al Blob de Vercel
    const blob = await put(filename, req.body, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Guardar la URL en la base de datos
    const [updatedUser] = await sql`
      UPDATE users 
      SET profile_image_url = ${blob.url}
      WHERE id = ${req.user.id}
      RETURNING id, username, email, gender, birth_year as "birthYear", newsletter, profile_image_url as "profileImageUrl"
    `;

    // Borrar la imagen anterior del Blob (si existía y es de Vercel Blob)
    if (currentUser?.profile_image_url && currentUser.profile_image_url.includes('blob.vercel-storage.com')) {
      try {
        await del(currentUser.profile_image_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch (e) {
        console.warn('No se pudo borrar la imagen anterior:', e.message);
      }
    }

    res.json({
      message: 'Imagen de perfil actualizada',
      url: blob.url,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    res.status(500).json({ message: 'Error al subir la imagen de perfil' });
  }
});

// DELETE /api/avatar/upload — Borrar imagen de perfil del Blob de Vercel
router.delete('/upload', async (req, res) => {
  try {
    const [user] = await sql`
      SELECT profile_image_url FROM users WHERE id = ${req.user.id}
    `;

    if (!user?.profile_image_url) {
      return res.status(404).json({ message: 'No tienes imagen de perfil' });
    }

    // Borrar del Blob
    if (user.profile_image_url.includes('blob.vercel-storage.com')) {
      await del(user.profile_image_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }

    // Restablecer al valor DEFAULT de la columna (URL por defecto de Vercel)
    const [updatedUser] = await sql`
      UPDATE users 
      SET profile_image_url = DEFAULT
      WHERE id = ${req.user.id}
      RETURNING id, username, email, gender, birth_year as "birthYear", newsletter, profile_image_url as "profileImageUrl"
    `;

    res.json({
      message: 'Imagen de perfil eliminada',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error al borrar avatar:', error);
    res.status(500).json({ message: 'Error al borrar la imagen de perfil' });
  }
});

module.exports = router;
