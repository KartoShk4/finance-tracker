import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Компонент страницы FAQ (Часто задаваемые вопросы)
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="faq-page">
      <div class="faq-header">
        <a routerLink="/" class="back-button">← Назад</a>
        <h1>Часто задаваемые вопросы</h1>
      </div>

      <div class="faq-content">
        <div class="faq-section">
          <h2 class="faq-section-title">Общие вопросы</h2>
          
          <div class="faq-item">
            <h3 class="faq-question">Что такое Finance Tracker?</h3>
            <div class="faq-answer">
              <p>Finance Tracker — это удобное веб-приложение для отслеживания личных финансов. Вы можете создавать категории доходов и расходов, добавлять транзакции, анализировать статистику с помощью графиков и многое другое.</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Как начать использовать приложение?</h3>
            <div class="faq-answer">
              <p>Для начала работы необходимо авторизоваться через VK ID. После авторизации вы сможете создавать категории и добавлять транзакции. В демо-режиме доступно создание ограниченного количества категорий и транзакций для тестирования функционала.</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Что такое демо-режим?</h3>
            <div class="faq-answer">
              <p>Демо-режим позволяет попробовать приложение без регистрации. В демо-режиме вы можете создать до 2 категорий и 2 транзакций. Для полного доступа ко всем функциям необходимо авторизоваться через VK ID.</p>
            </div>
          </div>
        </div>

        <div class="faq-section">
          <h2 class="faq-section-title">Работа с категориями</h2>
          
          <div class="faq-item">
            <h3 class="faq-question">Как создать категорию?</h3>
            <div class="faq-answer">
              <p>На главной странице введите название категории в поле ввода и нажмите кнопку "Добавить". Категория создается без привязки к типу (доход/расход), тип определяется при создании первой транзакции в этой категории.</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Что такое теги (подкатегории)?</h3>
            <div class="faq-answer">
              <p>Теги — это подкатегории, которые можно создавать внутри категорий для более детальной классификации транзакций. Например, в категории "Продукты" можно создать теги "Молочные продукты", "Овощи и фрукты" и т.д.</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Как удалить категорию?</h3>
            <div class="faq-answer">
              <p>Перейдите на страницу категории и нажмите кнопку "Удалить категорию" в правом верхнем углу. При удалении категории все связанные транзакции и теги также будут удалены. Это действие нельзя отменить.</p>
            </div>
          </div>
        </div>

        <div class="faq-section">
          <h2 class="faq-section-title">Транзакции</h2>
          
          <div class="faq-item">
            <h3 class="faq-question">Как добавить транзакцию?</h3>
            <div class="faq-answer">
              <p>Откройте нужную категорию, выберите тип транзакции (доход или расход), введите сумму, укажите дату и время, при необходимости добавьте примечание и выберите тег. Затем нажмите кнопку "Добавить".</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Как редактировать транзакцию?</h3>
            <div class="faq-answer">
              <p>На странице категории найдите нужную транзакцию и нажмите кнопку редактирования (✎). После изменения данных нажмите "Сохранить".</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Как удалить транзакцию?</h3>
            <div class="faq-answer">
              <p>На странице категории найдите нужную транзакцию и нажмите кнопку удаления (×). Транзакция будет удалена, а общая сумма категории будет пересчитана автоматически.</p>
            </div>
          </div>
        </div>

        <div class="faq-section">
          <h2 class="faq-section-title">Графики и статистика</h2>
          
          <div class="faq-item">
            <h3 class="faq-question">Как работают графики?</h3>
            <div class="faq-answer">
              <p>Приложение автоматически строит графики на основе ваших транзакций. Вы можете выбирать период отображения (день, неделя, месяц, год). Графики обновляются в реальном времени при добавлении или изменении транзакций.</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Почему график показывает неправильные данные?</h3>
            <div class="faq-answer">
              <p>Убедитесь, что даты транзакций указаны корректно. График группирует транзакции по выбранному периоду. Если проблема сохраняется, попробуйте отредактировать транзакцию и пересохранить её.</p>
            </div>
          </div>
        </div>

        <div class="faq-section">
          <h2 class="faq-section-title">Авторизация и безопасность</h2>
          
          <div class="faq-item">
            <h3 class="faq-question">Безопасны ли мои данные?</h3>
            <div class="faq-answer">
              <p>Да, все данные хранятся в защищенной базе данных Supabase. Каждый пользователь имеет доступ только к своим данным. Данные не передаются третьим лицам.</p>
            </div>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">Могу ли я использовать приложение на разных устройствах?</h3>
            <div class="faq-answer">
              <p>Да, приложение работает через браузер на любом устройстве (компьютер, планшет, смартфон). Достаточно авторизоваться с того же VK аккаунта, и вы увидите все свои данные.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .faq-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-xl) var(--space-md);
    }

    .faq-header {
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

    .faq-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .faq-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-2xl);
    }

    .faq-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .faq-section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      padding-bottom: var(--space-md);
      border-bottom: 2px solid var(--color-border);
    }

    .faq-item {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      transition: all var(--transition-fast);
    }

    .faq-item:hover {
      border-color: var(--color-border-hover);
      box-shadow: var(--shadow-sm);
    }

    .faq-question {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-md) 0;
    }

    .faq-answer {
      color: var(--color-text-secondary);
      line-height: 1.7;
    }

    .faq-answer p {
      margin: 0;
      font-size: 0.9375rem;
    }

    @media (max-width: 768px) {
      .faq-page {
        padding: var(--space-lg) var(--space-md);
      }

      .faq-header h1 {
        font-size: 1.5rem;
      }

      .faq-section-title {
        font-size: 1.25rem;
      }

      .faq-question {
        font-size: 1rem;
      }

      .faq-item {
        padding: var(--space-md);
      }
    }
  `]
})
export class FaqPage {}

