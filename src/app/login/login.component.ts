import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  constructor(private authService: AuthService, private formBuilder: FormBuilder, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url === '/login')
    ).subscribe(() => {
      this.errorMessage = null;
    });
  }

  errorMessage: string | null = null;

  email!: string;
  password!: string;
  editForm!: FormGroup

  ngOnInit(): void {
    this.initForm();
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  initForm() {
    this.editForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  private translateErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Correo electronico o contraseña incorrectas. Inténtalo de nuevo.';
      case 'auth/invalid-email':
        return 'La dirección de correo electrónico no es valida.';
      default:
        return 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
    }
  }

  login() {
    if (this.editForm.valid) {
      const { email, password } = this.editForm.value;
      this.authService.login(email, password).then(() => {
        console.log('Inicio de sesión exitoso');
        this.router.navigate(['/home']);
      }).catch((error) => {
        console.error('Error durante el inicio de sesión:', error);
        this.errorMessage = this.translateErrorMessage(error.code);
      });
    } else {
      console.log('El formulario es inválido');
    }
  }


}
