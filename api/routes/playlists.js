const express = require('express');
const axios = require('axios');
const { neon } = require('@neondatabase/serverless');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const sql = neon(process.env.SHDB_DATABASE_URL);
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

router.use(authenticateToken);

const LOOKUP_CHUNK_SIZE = 100;

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

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

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

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

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

router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const listNameRaw = req.body?.name ?? req.body?.listName ?? '';
    const listName = String(listNameRaw).trim();

    if (listName.length < 2 || listName.length > 60) {
      return res.status(400).json({
        error: 'El nombre de la lista debe tener entre 2 y 60 caracteres',
      });
    }

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

router.get('/library/songs', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

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

router.get('/:playlistId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const playlistId = parsePlaylistId(req.params.playlistId);
    if (!playlistId) {
      return res.status(400).json({ error: 'ID de playlist invalido' });
    }

    const playlist = await getOwnedPlaylist(userId, playlistId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

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

router.post('/:playlistId/songs', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const playlistId = parsePlaylistId(req.params.playlistId);
    if (!playlistId) {
      return res.status(400).json({ error: 'ID de playlist invalido' });
    }

    const ownedPlaylist = await getOwnedPlaylist(userId, playlistId);
    if (!ownedPlaylist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

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

router.delete('/:playlistId/songs/:trackId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const playlistId = parsePlaylistId(req.params.playlistId);
    if (!playlistId) {
      return res.status(400).json({ error: 'ID de playlist invalido' });
    }

    const ownedPlaylist = await getOwnedPlaylist(userId, playlistId);
    if (!ownedPlaylist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

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

router.delete('/:playlistId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const playlistId = parsePlaylistId(req.params.playlistId);
    if (!playlistId) {
      return res.status(400).json({ error: 'ID de playlist invalido' });
    }

    const ownedPlaylist = await getOwnedPlaylist(userId, playlistId);
    if (!ownedPlaylist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // ON DELETE CASCADE en songs_list.list_id elimina las canciones automaticamente
    await sql`DELETE FROM user_lists WHERE id = ${playlistId} AND user_id = ${userId}`;

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar playlist:', error);
    res.status(500).json({ error: 'No se pudo eliminar la playlist' });
  }
});

module.exports = router;
