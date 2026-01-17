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
  template: `
    <div class="about-page">
      <div class="about-header">
        <a routerLink="/" class="back-button">← Назад</a>
        <h1>О проекте</h1>
      </div>

      <div class="about-content">
        <!-- Основная информация -->
        <section class="about-section">
          <h2 class="section-title">Finance Tracker</h2>
          <p class="section-text">
            Finance Tracker — это проприетарное приложение для управления личными финансами.
            Приложение создано с использованием современных веб-технологий и доступно
            абсолютно бесплатно для всех пользователей.
          </p>
        </section>

        <!-- Лицензия -->
        <section class="about-section">
          <div class="license-badge">
            <svg class="license-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div>
              <h3>Proprietary License</h3>
              <p>Проприетарное программное обеспечение</p>
            </div>
          </div>
          <p class="section-text">
            Finance Tracker распространяется под проприетарной лицензией. Все права на программное
            обеспечение, его исходный код и связанные материалы принадлежат разработчику.
            Приложение предоставляется для личного некоммерческого использования. Запрещается
            копирование, модификация, распространение или коммерческое использование без
            письменного разрешения правообладателя.
          </p>
        </section>

        <!-- Технологии -->
        <section class="about-section">
          <h2 class="section-title">Технологии</h2>
          <div class="tech-stack">
            <div class="tech-item">
              <span class="tech-name">Angular</span>
              <span class="tech-desc">Frontend фреймворк</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">TypeScript</span>
              <span class="tech-desc">Типизированный JavaScript</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">Supabase</span>
              <span class="tech-desc">Backend и база данных</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">Chart.js</span>
              <span class="tech-desc">Графики и визуализация</span>
            </div>
            <div class="tech-item">
              <span class="tech-name">VK ID</span>
              <span class="tech-desc">Авторизация</span>
            </div>
          </div>
        </section>

        <!-- Поддержка проекта -->
        <section class="about-section donation-section">
          <div class="donation-header">
            <span class="donation-emoji">☕</span>
            <h2 class="section-title">Поддержать проект</h2>
          </div>
          <p class="section-text">
            Если вам нравится Finance Tracker, и вы хотите поддержать развитие проекта,
            вы можете отблагодарить разработчика чашечкой кофе! Это поможет мотивировать
            на дальнейшее развитие и улучшение приложения.
          </p>

          <div class="donation-methods">
            <div class="donation-card">
              <div class="donation-icon">💳</div>
              <h3 class="donation-title">ЮMoney</h3>
              <div class="donation-details">
                <p class="donation-note">
                  Быстрая и безопасная поддержка через ЮMoney (Яндекс.Деньги)
                </p>
                <a
                  href="https://yoomoney.ru/to/yourlink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="donation-link-button">
                  <span>Поддержать через ЮMoney</span>
                  <svg class="external-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>

            <div class="donation-card">
              <div class="donation-icon">📱</div>
              <h3 class="donation-title">Qiwi</h3>
              <div class="donation-details">
                <p class="donation-note">
                  Удобная поддержка через Qiwi кошелек
                </p>
                <a
                  href="https://qiwi.com/n/yourname"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="donation-link-button">
                  <span>Поддержать через Qiwi</span>
                  <svg class="external-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div class="donation-thanks">
            <p>Спасибо за поддержку! 🙏</p>
            <p class="donation-subtext">Каждая поддержка очень важна и мотивирует на дальнейшую работу над проектом.</p>
          </div>
        </section>

        <!-- Контакты -->
        <section class="about-section">
          <h2 class="section-title">Контакты</h2>
          <div class="contacts">
            <a
              href="https://vk.com/emuhamadeev"
              target="_blank"
              rel="noopener noreferrer"
              class="contact-link">
              <span class="contact-emoji">💬</span>
              VK
            </a>
          </div>
          <p class="section-text" style="margin-top: var(--space-md);">
            По вопросам использования приложения, предложений по улучшению или сотрудничеству
            обращайтесь через указанные контакты.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .about-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-xl) var(--space-md);
    }

    .about-header {
      margin-bottom: var(--space-2xl);
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) 0;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color var(--transition-fast);
      margin-bottom: var(--space-lg);
    }

    .back-button:hover {
      color: var(--color-primary);
    }

    .about-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .about-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-2xl);
    }

    .about-section {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-md) 0;
    }

    .section-text {
      color: var(--color-text-secondary);
      line-height: 1.7;
      font-size: 0.9375rem;
      margin: 0;
    }

    /* Лицензия секция */
    .license-badge {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-lg);
      background-color: var(--color-bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
    }

    .license-icon {
      width: 48px;
      height: 48px;
      color: var(--color-text-primary);
      flex-shrink: 0;
    }

    .license-badge h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-xs) 0;
    }

    .license-badge p {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Технологии */
    .tech-stack {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-md);
      margin-top: var(--space-md);
    }

    .tech-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      padding: var(--space-md);
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .tech-name {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 1rem;
    }

    .tech-desc {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    /* Поддержка проекта */
    .donation-section {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
      border-color: var(--color-primary);
    }

    .donation-header {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .donation-emoji {
      font-size: 2rem;
    }

    .donation-methods {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-lg);
      margin: var(--space-xl) 0;
    }

    .donation-card {
      background-color: var(--color-bg-secondary);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      transition: all var(--transition-fast);
    }

    .donation-card:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .donation-icon {
      font-size: 2rem;
      margin-bottom: var(--space-md);
    }

    .donation-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-md) 0;
    }

    .donation-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .donation-label {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .donation-value {
      font-size: 0.9375rem;
      color: var(--color-text-primary);
      margin: 0;
      position: relative;
    }

    .donation-link-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: var(--space-md) var(--space-lg);
      background-color: var(--color-primary);
      color: white;
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.9375rem;
      transition: all var(--transition-fast);
      margin-top: var(--space-md);
      width: 100%;
    }

    .donation-link-button:hover {
      background-color: #6366f1;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .donation-link-button:active {
      transform: translateY(0);
    }

    .external-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .donation-note {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: var(--space-sm);
      padding: var(--space-sm);
      background-color: rgba(99, 102, 241, 0.1);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--color-primary);
    }

    .donation-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .donation-link:hover {
      text-decoration: underline;
    }

    .donation-thanks {
      text-align: center;
      padding: var(--space-xl);
      background-color: rgba(99, 102, 241, 0.1);
      border-radius: var(--radius-md);
      margin-top: var(--space-lg);
    }

    .donation-thanks p:first-child {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-sm) 0;
    }

    .donation-subtext {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Контакты */
    .contacts {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md);
      margin-top: var(--space-md);
    }

    .contact-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md) var(--space-lg);
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      text-decoration: none;
      font-weight: 500;
      transition: all var(--transition-fast);
    }

    .contact-link:hover {
      background-color: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .contact-icon {
      width: 20px;
      height: 20px;
    }

    .contact-emoji {
      font-size: 1.25rem;
      line-height: 1;
    }

    @media (max-width: 768px) {
      .about-page {
        padding: var(--space-lg) var(--space-md);
      }

      .about-header h1 {
        font-size: 1.5rem;
      }

      .about-section {
        padding: var(--space-lg);
      }

      .section-title {
        font-size: 1.25rem;
      }

      .donation-methods {
        grid-template-columns: 1fr;
      }

      .tech-stack {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AboutPage {
}

