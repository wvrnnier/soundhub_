import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MusicService, Track } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';
import { AuthService, User } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user-service';
import { PlaylistService } from '../../../core/services/playlist-service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { PlaylistCardComponent } from '../playlist-card/playlist-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PlaylistCardComponent, TrackCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {

  music = inject(MusicService);
  authService = inject(AuthService);
  userService = inject(UserService);
  playlistService = inject(PlaylistService);
  router = inject(Router);
  isEditing = false;
  isDeleting = false;
  currentUser: User | null = null;

  profileForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    newsletter: new FormControl(false),
    password: new FormControl('', [Validators.minLength(8)])
  });

  deletePasswordControl = new FormControl('', [Validators.required]);



  // Datos mockeados como fallback
  topTracks = this.music.homeTracks;

  // Número real de playlists del usuario
  playlistCount = computed(() => this.playlistService.playlists().length);

  // Si el usuario tiene listas → shuffle de canciones de sus listas
  // Si no → topTracks mockeadas
  hasPlaylists = computed(() => this.playlistService.playlists().length > 0);

  // Canciones de la biblioteca del usuario, convertidas a Track y mezcladas
  shuffledLibrarySongs = computed<Track[]>(() => {
    const songs = this.playlistService.librarySongs();
    if (songs.length === 0) return [];

    // Convertir PlaylistSong a Track
    const tracks: Track[] = songs.map(song => ({
      id: song.trackId,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      previewUrl: song.previewUrl ?? undefined,
      album: song.album ?? undefined,
      duration: song.duration ?? undefined,
      genre: song.genre ?? undefined,
    }));

    // Shuffle (Fisher-Yates)
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Canciones a mostrar en el perfil
  displayTracks = computed<Track[]>(() => {
    if (this.hasPlaylists()) {
      return this.shuffledLibrarySongs();
    }
    return this.topTracks();
  });

  // Título dinámico de la sección
  sectionTitle = computed(() => {
    return this.hasPlaylists()
      ? 'Tu colección'
      : 'Canciones más escuchadas de este mes';
  });

  userView = {
    name: '',
    image: '',
    playlists: 0
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.updateUserView(user);

        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          newsletter: user.newsletter
        }, { emitEvent: false });

        // Cargar playlists y canciones de biblioteca
        this.playlistService.loadPlaylists().subscribe({
          next: () => {
            // Si tiene listas, cargar canciones de la biblioteca
            if (this.playlistService.playlists().length > 0) {
              this.playlistService.loadLibrarySongs(24).subscribe();
            } else {
              // Si no tiene listas, cargar topTracks como fallback
              if (this.topTracks().length === 0) {
                this.music.getTrendingSongs();
              }
            }
          }
        });
      }
    });
    this.profileForm.valueChanges.subscribe(val => {
      if (this.isEditing) {
        // Solo actualizamos lo que se ve en la UI (el nombre en este caso)
        this.userView.name = val.username || this.userView.name;
      }
    });
  }
  updateUserView(user: User) {
    this.userView = {
      name: user.username,
      image: 'https://i.scdn.co/image/ab6761610000e5eb55d39ab9c22d51e4d94380f2',
      playlists: user.userLists ? user.userLists.length : 0
    };
  }
  toggleEdit() {
    this.isEditing = !this.isEditing;

    // Si cancelamos, reseteamos el formulario a los valores originales

    if (this.isEditing && this.currentUser) {

      this.updateUserView(this.currentUser);

      this.profileForm.patchValue({
        username: this.currentUser.username,
        email: this.currentUser.email,
        newsletter: this.currentUser.newsletter,
        //password: this.currentUser.password
      }, { emitEvent: false });
    }
  }
  saveProfile() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;

      const data = {
        username: formValue.username!,
        email: formValue.email!,
        newsletter: !!formValue.newsletter,
        ...(formValue.password ? { password: formValue.password } : {})
      };

      this.userService.updateProfile(data).subscribe({
        next: () => {
          this.isEditing = false;
          this.profileForm.controls.password.reset();
        },
        error: (err) => {
          console.error('Error al actualizar perfil:', err);
        }
      });
    }
  }

  deleteUser() {
    this.deletePasswordControl.reset();
    this.isDeleting = true;
  }

  cancelDelete() {
    this.isDeleting = false;
  }

  confirmDelete() {
    if (this.deletePasswordControl.valid && this.deletePasswordControl.value) {
      this.userService.deleteAccount(this.deletePasswordControl.value).subscribe({
        next: () => {
          this.isDeleting = false;
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error al eliminar cuenta:', err);
        }
      });
    }
  }
}
