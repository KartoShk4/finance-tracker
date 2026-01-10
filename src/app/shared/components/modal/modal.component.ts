import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Компонент модального окна
 * Используется для отображения диалогов подтверждения и других модальных окон
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-modal',
  template: `
    <div 
      class="modal-overlay"
      [class.show]="isOpen"
      (click)="onOverlayClick($event)"
      #overlay>
      <div 
        class="modal-container"
        (click)="$event.stopPropagation()"
        #container>
        <div class="modal-header" *ngIf="title">
          <h3 class="modal-title">{{ title }}</h3>
          <button 
            class="modal-close"
            (click)="close()"
            type="button"
            title="Закрыть">
            ×
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <button 
            *ngIf="showCancel"
            class="modal-button modal-button-cancel"
            (click)="onCancel()"
            type="button">
            {{ cancelText }}
          </button>
          <button 
            *ngIf="showConfirm"
            class="modal-button modal-button-confirm"
            (click)="onConfirm()"
            type="button"
            [class.danger]="confirmDanger">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-fast), visibility var(--transition-fast);
      padding: var(--space-md);
      backdrop-filter: blur(4px);
    }

    .modal-overlay.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-container {
      background-color: var(--color-bg-card);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.95);
      transition: transform var(--transition-fast);
      border: 1px solid var(--color-border);
    }

    .modal-overlay.show .modal-container {
      transform: scale(1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .modal-close:hover {
      background-color: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      transform: scale(1.1);
    }

    .modal-body {
      padding: var(--space-lg);
      color: var(--color-text-primary);
      line-height: 1.6;
    }

    .modal-footer {
      display: flex;
      gap: var(--space-md);
      justify-content: flex-end;
      padding: var(--space-lg);
      border-top: 1px solid var(--color-border);
    }

    .modal-button {
      padding: var(--space-sm) var(--space-lg);
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      min-width: 100px;
    }

    .modal-button-cancel {
      background-color: var(--color-bg-secondary);
      color: var(--color-text-secondary);
    }

    .modal-button-cancel:hover {
      background-color: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }

    .modal-button-confirm {
      background-color: var(--color-primary);
      color: white;
    }

    .modal-button-confirm:hover {
      background-color: var(--color-primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .modal-button-confirm.danger {
      background-color: var(--color-expense);
    }

    .modal-button-confirm.danger:hover {
      background-color: #dc2626;
    }

    @media (max-width: 480px) {
      .modal-container {
        max-width: calc(100% - var(--space-md));
        margin: var(--space-sm);
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--space-md) var(--space-sm);
      }

      .modal-title {
        font-size: 1.125rem;
      }

      .modal-body {
        font-size: 0.9375rem;
      }

      .modal-footer {
        flex-direction: column-reverse;
        gap: var(--space-sm);
      }

      .modal-button {
        width: 100%;
        font-size: 0.9375rem;
      }
    }

    @media (min-width: 481px) and (max-width: 768px) {
      .modal-container {
        max-width: calc(100% - var(--space-md));
        margin: var(--space-md);
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--space-md);
      }

      .modal-footer {
        flex-direction: column-reverse;
      }

      .modal-button {
        width: 100%;
      }
    }

    @media (min-width: 1921px) and (max-width: 2560px) {
      .modal-container {
        max-width: 600px;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--space-xl);
      }

      .modal-title {
        font-size: 1.5rem;
      }

      .modal-body {
        font-size: 1.125rem;
        line-height: 1.7;
      }

      .modal-button {
        font-size: 1.125rem;
        padding: var(--space-md) var(--space-xl);
        min-width: 120px;
      }
    }

    @media (min-width: 2561px) and (max-width: 3840px) {
      .modal-container {
        max-width: 700px;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--space-2xl);
      }

      .modal-title {
        font-size: 1.75rem;
      }

      .modal-body {
        font-size: 1.25rem;
        line-height: 1.8;
      }

      .modal-button {
        font-size: 1.25rem;
        padding: var(--space-lg) var(--space-2xl);
        min-width: 140px;
      }
    }

    @media (min-width: 3841px) {
      .modal-container {
        max-width: 800px;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--space-2xl) var(--space-xl);
      }

      .modal-title {
        font-size: 2rem;
      }

      .modal-body {
        font-size: 1.375rem;
        line-height: 1.8;
      }

      .modal-button {
        font-size: 1.375rem;
        padding: var(--space-xl) var(--space-2xl);
        min-width: 160px;
      }
    }
  `]
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() showFooter = true;
  @Input() showCancel = true;
  @Input() showConfirm = true;
  @Input() cancelText = 'Отмена';
  @Input() confirmText = 'Подтвердить';
  @Input() confirmDanger = false;
  @Input() closeOnOverlayClick = true;
  @Input() closeOnEscape = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closeEvent = new EventEmitter<void>();

  @ViewChild('overlay') overlay?: ElementRef<HTMLDivElement>;
  @ViewChild('container') container?: ElementRef<HTMLDivElement>;

  private escapeListener?: (event: KeyboardEvent) => void;

  ngAfterViewInit(): void {
    if (this.closeOnEscape) {
      this.escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escapeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
    }
  }

  onConfirm(): void {
    this.confirm.emit();
    this.close();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  close(): void {
    this.closeEvent.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (this.closeOnOverlayClick && event.target === this.overlay?.nativeElement) {
      this.close();
    }
  }
}




