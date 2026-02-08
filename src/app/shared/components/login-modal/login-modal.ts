import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.css',
  standalone: true
})
export class LoginModal {
  @Output() close = new EventEmitter<void>();
  @Output() openRegister = new EventEmitter<void>();

  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = null;

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al iniciar sesión';
        }
      });
    }
  }

  closeModal() {
    this.close.emit();
  }

  goToRegister() {
    this.close.emit();
    this.openRegister.emit();
  }
}
