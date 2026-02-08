import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-modal.html',
  styleUrl: './register-modal.css',
  standalone: true
})
export class RegisterModal {
  @Output() close = new EventEmitter<void>();

  registerForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  currentStep = 1;

  birthYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    // Generar años de nacimiento para el dropdown (de 13 a 100 años atrás)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 13; year >= currentYear - 100; year--) {
      this.birthYears.push(year);
    }

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      gender: ['', Validators.required],
      birthYear: ['', Validators.required],
      newsletter: [false]
    });
  }

  get isStep1Valid(): boolean {
    const email = this.registerForm.get('email');
    const username = this.registerForm.get('username');
    const password = this.registerForm.get('password');
    return !!(email?.valid && username?.valid && password?.valid);
  }

  get isStep2Valid(): boolean {
    const gender = this.registerForm.get('gender');
    const birthYear = this.registerForm.get('birthYear');
    return !!(gender?.valid && birthYear?.valid);
  }

  nextStep() {
    if (this.currentStep === 1 && this.isStep1Valid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.isStep2Valid) {
      this.currentStep = 3;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = null;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al registrarse';
        }
      });
    }
  }

  closeModal() {
    this.close.emit();
  }
}
