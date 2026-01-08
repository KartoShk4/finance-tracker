import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

// Air Datepicker типы подхватываются через import
import AirDatepicker from 'air-datepicker';

/**
 * Компонент выбора даты и времени на базе Air Datepicker
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-date-time-picker',
  template: `
    <div class="date-time-picker">
      <input
        #dateInput
        type="text"
        class="date-time-input"
        [placeholder]="placeholder"
        autocomplete="off"
        [value]="displayValue"
      />
      <button
        type="button"
        class="now-button"
        (click)="setNow()"
        title="Установить текущее время">
        Сейчас
      </button>
    </div>
  `,
  styles: [`
    .date-time-picker {
      display: flex;
      gap: var(--space-sm);
      align-items: center;
      flex: 1;
      min-width: 220px;
    }

    .date-time-input {
      flex: 1;
      padding: var(--space-sm) var(--space-md);
      font-size: 0.95rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-bg-card);
      color: var(--color-text-primary);
      transition: all var(--transition-fast);
    }

    .date-time-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
    }

    .now-button {
      padding: var(--space-sm) var(--space-md);
      font-size: 0.875rem;
      background-color: var(--color-bg-secondary);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }

    .now-button:hover {
      background-color: var(--color-bg-tertiary);
      border-color: var(--color-border-hover);
      color: var(--color-text-primary);
    }

    @media (max-width: 768px) {
      .date-time-picker {
        flex-direction: column;
        align-items: stretch;
      }

      .now-button {
        width: 100%;
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true
    }
  ]
})
export class DateTimePickerComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() placeholder = 'Выберите дату и время';
  @Input() minDate?: string;
  @Input() maxDate?: string;

  @Output() dateTimeChange = new EventEmitter<string>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  private picker?: AirDatepicker;
  private _value: string = new Date().toISOString();
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get displayValue(): string {
    return this.formatDisplay(new Date(this._value));
  }

  ngAfterViewInit(): void {
    // Подключаем стили AirDatepicker (уже импортированы глобально), инициализируем пикер
    this.initPicker();
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }

  private initPicker(): void {
    if (!this.dateInput?.nativeElement) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.picker = new AirDatepicker(this.dateInput.nativeElement, {
      timepicker: true,
      isMobile: false,
      autoClose: true,
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'HH:mm',
      locale: {
        days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        daysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        daysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      },
      selectedDates: [new Date(this._value)],
      minDate: this.minDate ? new Date(this.minDate) : undefined,
      maxDate: this.maxDate ? new Date(this.maxDate) : undefined,
      onSelect: ({ date }) => {
        if (!date) return;
        // Air Datepicker может вернуть Date или Date[], берем первый элемент если массив
        const selectedDate = Array.isArray(date) ? date[0] : date;
        if (!selectedDate) return;
        const iso = new Date(selectedDate).toISOString();
        this.setValue(iso, true);
      }
    });
  }

  private setValue(value: string, emit = false): void {
    this._value = value;
    this.onChange(value);
    this.onTouched();
    if (emit) {
      this.dateTimeChange.emit(value);
    }
    if (this.picker && this.dateInput?.nativeElement) {
      this.dateInput.nativeElement.value = this.formatDisplay(new Date(value));
    }
  }

  setNow(): void {
    const nowIso = new Date().toISOString();
    this.setValue(nowIso, true);
    this.picker?.selectDate(new Date(nowIso), { silent: true });
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    if (value) {
      this._value = value;
    }
    this.picker?.selectDate(new Date(this._value), { silent: true });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private formatDisplay(date: Date): string {
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
  }
}

