import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { LoginModal } from "../login-modal/login-modal";

@Component({
    selector: 'app-login-btn',
    templateUrl: './login-btn.html',
    styleUrls: ['./login-btn.css'],
    imports: [CommonModule, ReactiveFormsModule, LoginModal],
    standalone: true
})

export class LoginBtnComponent {
    isModalOpen = false;

    openLoginModal() {
        this.isModalOpen = true;
    }
    closeLoginModal() {
        this.isModalOpen = false;
    }
}





