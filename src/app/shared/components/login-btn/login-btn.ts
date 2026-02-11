import { Component, CUSTOM_ELEMENTS_SCHEMA   } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { LoginModal } from "../login-modal/login-modal";
import { RegisterModal } from "../register-modal/register-modal";

@Component({
    selector: 'app-login-btn',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './login-btn.html',
    styleUrls: ['./login-btn.css'],
    imports: [CommonModule, ReactiveFormsModule, LoginModal, RegisterModal],
    standalone: true
})
export class LoginBtnComponent {
    isLoginModalOpen = false;
    isRegisterModalOpen = false;

    openLoginModal() {
        this.isLoginModalOpen = true;
    }

    closeLoginModal() {
        this.isLoginModalOpen = false;
    }

    openRegisterModal() {
        this.isLoginModalOpen = false;
        this.isRegisterModalOpen = true;
    }

    closeRegisterModal() {
        this.isRegisterModalOpen = false;
    }
}





