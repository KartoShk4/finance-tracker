import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Компонент страницы FAQ (Часто задаваемые вопросы)
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.scss',
})
export class FaqPage {}

