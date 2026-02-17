import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService, User } from './auth.service';

interface UpdateProfileRequest {
  username: string;
  email: string;
  password?: string;
  newsletter: boolean;
}

interface ProfileResponse {
  message: string;
  user: User;
}

interface AvatarResponse {
  message: string;
  url: string;
  user: User;
}

interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = '/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /** GET /api/users/profile — obtener perfil del usuario autenticado */
  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  /** PUT /api/users/profile — actualizar username, email, password y newsletter */
  updateProfile(data: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http
      .put<ProfileResponse>(`${this.apiUrl}/profile`, data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => {
          // Sincronizar el usuario actualizado en localStorage y AuthService
          this.authService.updateCurrentUser(response.user);
        })
      );
  }

  /** DELETE /api/users/account — eliminar cuenta (requiere contraseña) */
  deleteAccount(password: string): Observable<MessageResponse> {
    return this.http
      .request<MessageResponse>('DELETE', `${this.apiUrl}/account`, {
        headers: this.getAuthHeaders(),
        body: { password },
      })
      .pipe(
        tap(() => {
          // Limpiar sesión tras eliminar la cuenta
          this.authService.logout();
        })
      );
  }

  /** POST /api/avatar/upload — subir imagen de perfil al Blob de Vercel */
  uploadAvatar(file: File): Observable<AvatarResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', file.type);

    return this.http
      .post<AvatarResponse>('/api/avatar/upload', file, { headers })
      .pipe(
        tap((response) => {
          this.authService.updateCurrentUser(response.user);
        })
      );
  }

  /** DELETE /api/avatar/upload — borrar imagen de perfil del Blob de Vercel */
  deleteAvatar(): Observable<{ message: string; user: User }> {
    return this.http
      .delete<{ message: string; user: User }>('/api/avatar/upload', {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => {
          this.authService.updateCurrentUser(response.user);
        })
      );
  }
}
