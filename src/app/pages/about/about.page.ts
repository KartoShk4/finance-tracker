import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Компонент страницы "О нас"
 * Информация о проекте, лицензия, реквизиты для поддержки
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss'
})
export class AboutPage {
}

