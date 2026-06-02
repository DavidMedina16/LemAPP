import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, InputText, Password, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** Estado de la petición para deshabilitar el botón y mostrar spinner. */
  readonly loading = signal(false);
  /** Mensaje de error a mostrar bajo el formulario (null = sin error). */
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        void this.router.navigate(['/dashboard']);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.status === 401
            ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
            : 'No se pudo conectar con el servidor. Intenta de nuevo.',
        );
      },
    });
  }
}
