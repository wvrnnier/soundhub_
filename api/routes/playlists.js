const express = require('express');
const axios = require('axios');
const { neon } = require('@neondatabase/serverless');
const authenticateToken = require('../middleware/auth');

// Configuracion base del router y conexion.
const router = express.Router();
const sql = neon(process.env.SHDB_DATABASE_URL);
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

router.use(authenticateToken);

const LOOKUP_CHUNK_SIZE = 100;

// ========================
// Helpers de validacion/auth
// ========================

function getUserId(req) {
  const userId = Number(req.user?.id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function parsePlaylistId(rawValue) {
  const playlistId = Number(rawValue);
  if (!Number.isInteger(playlistId) || playlistId <= 0) {
    return null;
  }
  return playlistId;
}

function requireAuthenticatedUserId(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return null;
  }
  return userId;
}

function requirePlaylistId(rawValue, res) {
  const playlistId = parsePlaylistId(rawValue);
  if (!playlistId) {
    res.status(400).json({ error: 'ID de playlist invalido' });
    return null;
  }
  return playlistId;
}

function requirePlaylistName(rawValue, res) {
  const listName = String(rawValue ?? '').trim();
  if (listName.length < 2 || listName.length > 60) {
    res.status(400).json({
      error: 'El nombre de la lista debe tener entre 2 y 60 caracteres',
    });
    return null;
  }
  return listName;
}

// ========================
// Helpers de acceso a datos
// ========================

async function getOwnedPlaylist(userId, playlistId) {
  const [playlist] = await sql`
    SELECT
      ul.id,
      ul.list_name AS "listName",
      ul.date AS "createdAt",
      COUNT(sl.id)::int AS "songCount"
      FROM user_lists ul
      LEFT JOIN songs_list sl ON sl.list_id = ul.id
      WHERE ul.user_id = ${userId} AND ul.id = ${playlistId}
      GROUP BY ul.id
  `;
  return playlist ?? null;
}

async function requireOwnedPlaylist(userId, playlistId, res) {
  const playlist = await getOwnedPlaylist(userId, playlistId);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist no encontrada' });
    return null;
  }
  return playlist;
}

// ========================
// Helpers de metadata iTunes
// ========================
// Esto divide un array en grupos de un tamaño menor
// Ejemplo: chunk([1,2,3,4,5], 2) => [[1,2], [3,4], [5]]
// Es útil para hacer consultas en lotes a la API
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}
// Elimina todos los valores false del array tarackIds con filter(Boolean)
// Crea un Set para eliminar duplicados y  lo esparce creando un nuevo array
async function getSongMetadata(trackIds) {
  const uniqueTrackIds = [...new Set(trackIds.filter(Boolean))];
  if (uniqueTrackIds.length === 0) {
    return new Map();
  }

  const metadata = new Map();
  const groups = chunk(uniqueTrackIds, LOOKUP_CHUNK_SIZE);

  for (const ids of groups) {
    const response = await axios.get(ITUNES_LOOKUP, {
      params: {
        id: ids.join(','),
        entity: 'song',
      },
    });

    const results = response.data?.results ?? [];
    for (const item of results) {
      if (!item?.trackId) continue;
      metadata.set(String(item.trackId), {
        previewUrl: item.previewUrl ?? null,
        album: item.collectionName ?? null,
        duration: item.trackTimeMillis ?? null,
        genre: item.primaryGenreName ?? null,
      });
    }
  }

  return metadata;
}

async function enrichSongs(songRows) {
  let metadataByTrackId = new Map();

  try {
    metadataByTrackId = await getSongMetadata(songRows.map((row) => row.trackId));
  } catch (error) {
    console.error('Error consultando metadata de iTunes:', error.message);
  }

  return songRows.map((row) => {
    const metadata = metadataByTrackId.get(row.trackId) ?? {};
    return {
      id: row.id,
      playlistId: row.playlistId,
      playlistName: row.playlistName,
      trackId: row.trackId,
      title: row.title,
      artist: row.artist,
      cover: row.cover,
      previewUrl: metadata.previewUrl ?? null,
      album: metadata.album ?? null,
      duration: metadata.duration ?? null,
      genre: metadata.genre ?? null,
    };
  });
}

// ========================
// Rutas de playlists
// ========================

// GET - Obtener todas las playlists del usuario autenticado.
router.get('/', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const playlists = await sql`
      SELECT
        ul.id,
        ul.list_name AS "listName",
        ul.date AS "createdAt",
        COUNT(sl.id)::int AS "songCount"
        FROM user_lists ul
        LEFT JOIN songs_list sl ON sl.list_id = ul.id
        WHERE ul.user_id = ${userId}
        GROUP BY ul.id
        ORDER BY ul.date DESC, ul.id DESC
    `;

    res.json(playlists);
  } catch (error) {
    console.error('Error al obtener playlists:', error);
    res.status(500).json({ error: 'No se pudieron obtener las playlists' });
  }
});

// POST - Crear una nueva playlist.
router.post('/', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const listName = requirePlaylistName(
      req.body?.name ?? req.body?.listName,
      res,
    );
    if (!listName) return;

    const [playlist] = await sql`
      INSERT INTO user_lists (user_id, list_name, date)
      VALUES (${userId}, ${listName}, NOW())
      RETURNING
        id,
        list_name AS "listName",
        date AS "createdAt"
    `;

    res.status(201).json({ ...playlist, songCount: 0 });
  } catch (error) {
    console.error('Error al crear playlist:', error);
    res.status(500).json({ error: 'No se pudo crear la playlist' });
  }
});

// GET - Obtener canciones recientes de la biblioteca de playlists.
router.get('/library/songs', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const limitRaw = Number(req.query.limit ?? 8);
    const limit = Number.isInteger(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 8;

    const songs = await sql`
      SELECT
        sl.id,
        sl.list_id AS "playlistId",
        ul.list_name AS "playlistName",
        sl.itunes_track_id AS "trackId",
        sl.song_name AS "title",
        sl.artist,
        sl.cover_url AS "cover"
        FROM songs_list sl
        INNER JOIN user_lists ul ON ul.id = sl.list_id
        WHERE ul.user_id = ${userId}
        ORDER BY sl.id DESC
        LIMIT ${limit}
    `;

    const enrichedSongs = await enrichSongs(songs);
    res.json(enrichedSongs);
  } catch (error) {
    console.error('Error al obtener canciones de biblioteca:', error);
    res.status(500).json({ error: 'No se pudieron obtener las canciones' });
  }
});

// GET - Obtener el detalle de una playlist con sus canciones.
router.get('/:playlistId', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const playlistId = requirePlaylistId(req.params.playlistId, res);
    if (!playlistId) return;

    const playlist = await requireOwnedPlaylist(userId, playlistId, res);
    if (!playlist) return;

    const songs = await sql`
      SELECT
        sl.id,
        sl.list_id AS "playlistId",
        ul.list_name AS "playlistName",
        sl.itunes_track_id AS "trackId",
        sl.song_name AS "title",
        sl.artist,
        sl.cover_url AS "cover"
        FROM songs_list sl
        INNER JOIN user_lists ul ON ul.id = sl.list_id
        WHERE sl.list_id = ${playlistId} AND ul.user_id = ${userId}
        ORDER BY sl.id DESC
    `;

    const enrichedSongs = await enrichSongs(songs);
    res.json({
      ...playlist,
      songs: enrichedSongs,
    });
  } catch (error) {
    console.error('Error al obtener detalle de playlist:', error);
    res.status(500).json({ error: 'No se pudo obtener la playlist' });
  }
});

// POST - Anadir una cancion a una playlist.
router.post('/:playlistId/songs', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const playlistId = requirePlaylistId(req.params.playlistId, res);
    if (!playlistId) return;

    const ownedPlaylist = await requireOwnedPlaylist(userId, playlistId, res);
    if (!ownedPlaylist) return;

    const trackId = String(req.body?.trackId ?? req.body?.id ?? '').trim();
    const title = String(req.body?.title ?? req.body?.songName ?? '').trim();
    const artist = String(req.body?.artist ?? '').trim();
    const cover = String(req.body?.cover ?? req.body?.coverUrl ?? '').trim();

    if (!trackId || !title || !artist) {
      return res.status(400).json({
        error: 'trackId, title y artist son obligatorios',
      });
    }

    if (trackId.length > 50) {
      return res.status(400).json({
        error: 'trackId no puede superar los 50 caracteres',
      });
    }

    if (title.length > 255) {
      return res.status(400).json({
        error: 'El titulo no puede superar los 255 caracteres',
      });
    }

    if (artist.length > 255) {
      return res.status(400).json({
        error: 'El artista no puede superar los 255 caracteres',
      });
    }

    // ON CONFLICT requiere UNIQUE(list_id, itunes_track_id) en songs_list
    const [song] = await sql`
      INSERT INTO songs_list (list_id, itunes_track_id, song_name, artist, cover_url)
      VALUES (${playlistId}, ${trackId}, ${title}, ${artist}, ${cover})
      ON CONFLICT (list_id, itunes_track_id) DO NOTHING
      RETURNING
        id,
        list_id AS "playlistId",
        itunes_track_id AS "trackId",
        song_name AS "title",
        artist,
        cover_url AS "cover"
    `;

    if (!song) {
      return res.status(409).json({ error: 'La cancion ya esta en la playlist' });
    }

    const [enrichedSong] = await enrichSongs([
      {
        ...song,
        playlistName: ownedPlaylist.listName,
      },
    ]);

    res.status(201).json(enrichedSong);
  } catch (error) {
    console.error('Error al anadir cancion:', error);
    res.status(500).json({ error: 'No se pudo anadir la cancion' });
  }
});

// DELETE - Eliminar una cancion de una playlist.
router.delete('/:playlistId/songs/:trackId', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const playlistId = requirePlaylistId(req.params.playlistId, res);
    if (!playlistId) return;

    if (!(await requireOwnedPlaylist(userId, playlistId, res))) return;

    const trackId = String(req.params.trackId ?? '').trim();
    if (!trackId) {
      return res.status(400).json({ error: 'trackId invalido' });
    }

    const deletedSongs = await sql`
      DELETE FROM songs_list
      WHERE list_id = ${playlistId} AND itunes_track_id = ${trackId}
      RETURNING id
    `;

    if (deletedSongs.length === 0) {
      return res.status(404).json({ error: 'Cancion no encontrada en la playlist' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar cancion:', error);
    res.status(500).json({ error: 'No se pudo eliminar la cancion' });
  }
});

// PATCH - Editar el nombre de una playlist.
router.patch('/:playlistId', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const playlistId = requirePlaylistId(req.params.playlistId, res);
    if (!playlistId) return;

    const listName = requirePlaylistName(
      req.body?.name ?? req.body?.listName,
      res,
    );
    if (!listName) return;

    const ownedPlaylist = await requireOwnedPlaylist(userId, playlistId, res);
    if (!ownedPlaylist) return;

    const [updatedPlaylist] = await sql`
      UPDATE user_lists
      SET list_name = ${listName}
      WHERE id = ${playlistId} AND user_id = ${userId}
      RETURNING
        id,
        list_name AS "listName",
        date AS "createdAt"
    `;

    if (!updatedPlaylist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    res.json({
      ...updatedPlaylist,
      songCount: ownedPlaylist.songCount,
    });
  } catch (error) {
    console.error('Error al editar nombre de playlist:', error);
    res.status(500).json({ error: 'No se pudo editar la playlist' });
  }
});

// DELETE - Eliminar una playlist completa.
router.delete('/:playlistId', async (req, res) => {
  try {
    const userId = requireAuthenticatedUserId(req, res);
    if (!userId) return;

    const playlistId = requirePlaylistId(req.params.playlistId, res);
    if (!playlistId) return;

    if (!(await requireOwnedPlaylist(userId, playlistId, res))) return;

    // ON DELETE CASCADE en songs_list.list_id elimina las canciones automaticamente
    await sql`DELETE FROM user_lists WHERE id = ${playlistId} AND user_id = ${userId}`;

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar playlist:', error);
    res.status(500).json({ error: 'No se pudo eliminar la playlist' });
  }
});

module.exports = router;
