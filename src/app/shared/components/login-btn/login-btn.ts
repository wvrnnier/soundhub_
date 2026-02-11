import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { LoginModal } from "../login-modal/login-modal";
import { RegisterModal } from "../register-modal/register-modal";
import { AuthService } from "../../../core/services/auth.service";

@Component({
    selector: 'app-login-btn',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './login-btn.html',
    styleUrls: ['./login-btn.css'],
    imports: [CommonModule, ReactiveFormsModule, LoginModal, RegisterModal],
    standalone: true
})
export class LoginBtnComponent {

    authService = inject(AuthService);
    currentUser$ = this.authService.currentUser$;

    isLoginModalOpen = false;
    isRegisterModalOpen = false;
    isLoggingOut = false;


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

    startLogout() {
        this.isLoggingOut = true;
    }

    cancelLogout() {
        this.isLoggingOut = false;
    }

    confirmLogout() {
        this.authService.logout();
        this.isLoggingOut = false;
    }
}





