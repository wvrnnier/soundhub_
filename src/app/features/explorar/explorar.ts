
 // Importamos los módulos y servicios necesarios
import { Component, signal } from '@angular/core'; // señal reactiva de Angular
import { CommonModule } from '@angular/common'; // Módulo común de Angular
import { RouterLink } from '@angular/router'; // Para enlaces de navegación
import { MusicService, Track } from '../../core/services/music'; //º Servicio de música y la interfaz Track

@Component({ // Definición del componente
  selector: 'app-explorar',// Nombre del selector
  standalone: true, 
  imports: [CommonModule, RouterLink], // Módulos importados
  templateUrl: './explorar.html', 
  styleUrl: './explorar.css'
}) // Basicamente declaramos el componente standalone, decimos que modulos usar y conecta el html y css.

export class ExplorarComponent { // Definimos la clase del componente
  term = signal<string>('');       // texto del buscador
  results = signal<Track[]>([]);   // lista mostrada

  constructor(public music: MusicService) { // Inyectamos el servicio de música
    this.results.set(this.music.tracks()); // carga inicial de canciones
  }

  onSearch(v: string) { // Aquí manejamos la busqueda
    this.term.set(v); // Actualizamos el término de búsqueda
    this.results.set(this.music.search(v)); // Actualizamos los resultados de búsqueda
  }

  isFav(id: string) { // Comprueba si una canción es favorita
    return this.music.favs().includes(id);
  }

  toggle(id: string) { //Llama al servicio para añadir o eliminar de favs
    this.music.toggleFav(id);
  }
}
