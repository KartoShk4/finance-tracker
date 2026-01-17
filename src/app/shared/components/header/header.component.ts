import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {VkLoginComponent} from '../vk-login/vk-login.components';
import {VkAuthService} from '../../../core/auth/auth.service';

/**
 * Компонент футера приложения
 * Содержит информацию о приложении, ссылки и копирайт
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLinkActive, RouterLink, VkLoginComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
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
    this.router.navigate(['/']).then();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


