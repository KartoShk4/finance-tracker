import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';

/**
 * Корневой компонент приложения
 * Содержит основную структуру приложения (шапка и контент)
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  authService = inject(AuthService);

  async signInWithVK(): Promise<void> {
    try {
      await this.authService.signInWithVK();
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(error.message || 'Ошибка при входе через ВКонтакте. Убедитесь, что VK App ID настроен в environment.ts');
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
