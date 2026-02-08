const express = require('express');
const axios = require('axios');
const router = express.Router();

const ITUNES_API = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

// Búsqueda flexible por entity type
router.get('/search', async (req, res) => {
  try {
    const { 
      term, 
      entity = 'song',      // Default: song
      limit = 20,
      country = 'US'
    } = req.query;

    if (!term) {
      return res.status(400).json({ error: 'El parámetro "term" es requerido' });
    }

    // Validar entity types permitidos
    const validEntities = [
      'musicArtist', 'musicTrack', 'album', 
      'musicVideo', 'mix', 'song'
    ];

    if (!validEntities.includes(entity)) {
      return res.status(400).json({ 
        error: 'Entity no válida',
        validEntities 
      });
    }
// Cambiar a fetch nativo de Node.js si es necesario
    const response = await axios.get(ITUNES_API, {
      params: {
        term,
        media: 'music',
        entity,
        limit,
        country
      }
    });
    
    // Transformar según el tipo de entidad
    const results = response.data.results.map(item => 
      transformByEntity(item, entity)
    );
    
    res.json({
      resultCount: response.data.resultCount,
      entity,
      results
    });
    
  } catch (error) {
    console.error('Error en iTunes API:', error.message);
    res.status(500).json({ error: 'Error al buscar en iTunes' });
  }
});

    function getBestArtwork(item) {
      const baseUrl = item.artworkUrl100 || item.artworkUrl60 || item.artworkUrl30;
      
      if (!baseUrl) return null;
      
      return baseUrl.replace(/\/\d+x\d+bb/, '/600x600bb');
    }

// Función helper para transformar datos según entidad
function transformByEntity(item, entity) {
if (!item) return null;
//Agregar tpye: 'track' a los objetos
  switch(entity) {
    case 'song':
    case 'musicTrack':
      return {
        id: item.trackId?.toString(),
        title: item.trackName,
        artist: item.artistName,
        artistId: item.artistId?.toString(),
        album: item.collectionName,
        albumId: item.collectionId?.toString(),
        //Introducir fallback para imágenes 100, 60...
        cover: getBestArtwork(item),
        previewUrl: item.previewUrl,
        releaseDate: item.releaseDate,
        duration: item.trackTimeMillis,
        genre: item.primaryGenreName
      };
      
      case 'musicArtist':
        return {
          id: item.artistId?.toString(),
          name: item.artistName,
          genre: item.primaryGenreName,
          artistLinkUrl: item.artistLinkUrl
        };
        
        case 'album':
      return {
        id: item.collectionId?.toString(),
        title: item.collectionName,
        artist: item.artistName,
        artistId: item.artistId?.toString(),
        cover: getBestArtwork(item),
        releaseDate: item.releaseDate,
        trackCount: item.trackCount,
        genre: item.primaryGenreName,
        price: item.collectionPrice,
        currency: item.currency
      };

    case 'musicVideo':
      return {
        id: item.trackId?.toString(),
        title: item.trackName,
        artist: item.artistName,
        cover: getBestArtwork(item),
        previewUrl: item.previewUrl,
        releaseDate: item.releaseDate,
        duration: item.trackTimeMillis
      };

    case 'mix':
      return {
        id: item.collectionId?.toString(),
        title: item.collectionName,
        curator: item.curatorName,
        cover: getBestArtwork(item),
        releaseDate: item.releaseDate
      };

    default:
        console.warn(`Entity type desconocido: ${entity}`);
        return { type: 'unknown', raw: item };
  }
}

// Obtener detalles de una canción por ID
router.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(ITUNES_LOOKUP, {
      params: {
        id,
        entity: 'song'
      }
    });

    if (response.data.resultCount === 0) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }

    const item = response.data.results[0];
    const track = transformByEntity(item, 'song');

    res.json(track);

  } catch (error) {
    console.error('Error en iTunes API:', error.message);
    res.status(500).json({ error: 'Error al obtener la canción' });
  }
});

// Obtener detalles de un artista por ID
router.get('/artist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const response = await axios.get(ITUNES_LOOKUP, {
      params: {
        id,
        entity: 'song',
        limit
      }
    });

    if (response.data.resultCount === 0) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    const [artist, ...tracks] = response.data.results;

    res.json({
      artist: {
        id: artist.artistId?.toString(),
        name: artist.artistName,
        genre: artist.primaryGenreName
      },
      tracks: tracks.map(item => transformByEntity(item, 'song'))
    });

  } catch (error) {
    console.error('Error en iTunes API:', error.message);
    res.status(500).json({ error: 'Error al obtener el artista' });
  }
});

// Obtener detalles de un álbum por ID
router.get('/album/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(ITUNES_LOOKUP, {
      params: {
        id,
        entity: 'song'
      }
    });

    if (response.data.resultCount === 0) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }

    const [album, ...tracks] = response.data.results;

    res.json({
      album: transformByEntity(album, 'album'),
      tracks: tracks.map(item => transformByEntity(item, 'song'))
    });

  } catch (error) {
    console.error('Error en iTunes API:', error.message);
    res.status(500).json({ error: 'Error al obtener el álbum' });
  }
});

module.exports = router;