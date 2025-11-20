import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } 
from '@angular/forms';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-login-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.css',
  standalone: true
})
export class LoginModal {
    @Output() close = new EventEmitter<void>();

  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      // Aquí iría la lógica de autenticación (petición al servidor, etc.)
    }
  }

  closeModal() {
    this.close.emit();
  }
}
