import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VkLoginComponent } from './shared/components/vk-login/vk-login.components';
import { FloatingOneTapComponent } from './shared/components/floating-one-tap/floating-one-tap.component';
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
    FloatingOneTapComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  authService = inject(VkAuthService);

  async signOut(): Promise<void> {
    try {
      this.authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
