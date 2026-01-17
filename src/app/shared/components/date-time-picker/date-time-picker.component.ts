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
  templateUrl: './date-time-picker.component.html',
  styleUrl: "./date-time-picker.component.scss",
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

    this.picker = new AirDatepicker(this.dateInput.nativeElement, {
      timepicker: true,
      isMobile: true,
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

    // Устанавливаем начальное значение в поле ввода
    if (this._value) {
      const date = new Date(this._value);
      if (!isNaN(date.getTime())) {
        this.dateInput.nativeElement.value = this.formatDisplay(date);
      }
    }
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
      // Обновляем пикер, если он уже инициализирован
      if (this.picker && this.dateInput?.nativeElement) {
        const date = new Date(this._value);
        if (!isNaN(date.getTime())) {
          this.picker.selectDate(date, { silent: true });
          this.dateInput.nativeElement.value = this.formatDisplay(date);
        }
      }
    }
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

