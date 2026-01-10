import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VkLoginComponent } from './shared/components/vk-login/vk-login.components';
import { FloatingOneTapComponent } from './shared/components/floating-one-tap/floating-one-tap.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
import { VkAuthService } from './core/auth/auth.service';

/**
 * Корневой компонент приложения
 * Содержит основную структуру приложения (шапка и контент)
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    CommonModule, 
    VkLoginComponent,
    FloatingOneTapComponent,
    FooterComponent,
    SnackbarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  authService = inject(VkAuthService);
  router = inject(Router);

  async signOut(): Promise<void> {
    try {
      this.authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
