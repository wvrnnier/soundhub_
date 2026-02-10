import { Component, OnInit, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MusicService } from '../../../core/services/music-service';
import { TrackCardComponent } from '../track-card/track-card';
import { AuthService, User } from '../../../core/services/auth.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TrackCardComponent, ReactiveFormsModule, MatDialogModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {

  music = inject(MusicService);
  authService = inject(AuthService);
  isEditing = false;
  currentUser: User | null = null;

  profileForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    newsletter: new FormControl(false),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  dialog = inject(MatDialog);
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  // Reutilizamos datos del servicio para simular "Top"
  topTracks = this.music.homeTracks;

  userView = {
    name: '',
    image: '',
    playlists: 0
  }

  ngOnInit() {
    // Aseguramos que haya datos cargados
    if (this.topTracks().length === 0) {
      this.music.loadHomeSongs();
    }
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userView = {
          name: user.username,
          image: 'https://i.scdn.co/image/ab6761610000e5eb55d39ab9c22d51e4d94380f2', // Placeholder style
          playlists: user.userLists ? user.userLists.length : 0
        };

        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          newsletter: user.newsletter
        });
      }
    });
  }
  toggleEdit() {
    this.isEditing = !this.isEditing;

    // Si cancelamos, reseteamos el formulario a los valores originales

    if (this.isEditing && this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username,
        email: this.currentUser.email,
        newsletter: this.currentUser.newsletter,
        //password: this.currentUser.password
      });
    }
  }
  saveProfile() {
    if (this.profileForm.valid) {
      this.isEditing = false;
      //LLAMAR AL SERVICIO PARA ACTUALIZAR EL PERFIL
    }
  }
  deleteUser() {
    const dialogRef = this.dialog.open(this.deleteDialog);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        //LLAMAR AL SERVICIO PARA BORRAR EL PERFIL
      }
    })

  }
}
