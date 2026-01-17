import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Компонент футера приложения
 * Содержит информацию о приложении, ссылки и копирайт
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


