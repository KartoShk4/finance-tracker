import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto';
import { PeriodType } from '../../utils/chart.utils';

/**
 * Компонент для отображения графика транзакций
 * Использует Chart.js для визуализации данных
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Метки для оси X (даты/периоды) */
  @Input() labels: string[] = [];
  
  /** Данные для отображения (значения) */
  @Input() data: number[] = [];
  
  /** Выбранный период агрегации */
  @Input() period: PeriodType = 'day';
  
  /** Событие изменения периода */
  @Output() periodChange = new EventEmitter<PeriodType>();

  /** Ссылка на canvas элемент */
  @ViewChild('canvas', { static: false })
  canvas!: ElementRef<HTMLCanvasElement>;

  /** Экземпляр графика Chart.js */
  chart!: Chart;

  /** Доступные периоды для переключения */
  readonly periods: { value: PeriodType; label: string }[] = [
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'year', label: 'Год' }
  ];

  /**
   * Инициализация графика после появления canvas в DOM
   */
  ngAfterViewInit(): void {
    // Используем двойной requestAnimationFrame для гарантии, что canvas полностью отрендерен
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.canvas?.nativeElement && this.hasData) {
          this.initChart();
        }
      });
    });
  }

  /**
   * Обновление графика при изменении входных данных
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Используем двойной requestAnimationFrame для гарантии, что изменения применены
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.chart) {
          // Если график еще не инициализирован, инициализируем его при наличии данных
          if (this.canvas?.nativeElement) {
            if (this.hasData) {
              this.initChart();
            }
          }
          return;
        }

        // Обновляем данные графика
        if (changes['labels'] || changes['data'] || changes['period']) {
          if (this.hasData) {
            this.updateChart();
          } else {
            // Если данных нет, уничтожаем график
            if (this.chart) {
              this.chart.destroy();
              this.chart = null as any;
            }
          }
        }
      });
    });
  }

  /**
   * Инициализация графика с настройками
   */
  private initChart(): void {
    // Уничтожаем предыдущий график, если он существует
    if (this.chart) {
      this.chart.destroy();
      this.chart = null as any;
    }

    if (!this.canvas?.nativeElement || !this.hasData) {
      return;
    }

    // Вычисляем кумулятивные данные (накопление суммы)
    const cumulativeData = this.calculateCumulativeData(this.data);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.labels.length > 0 ? this.labels : [],
        datasets: [
          {
            label: 'Накопленная сумма',
            data: cumulativeData,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: this.data.length > 20 ? 0 : 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgb(99, 102, 241)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2,
            spanGaps: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
              family: "'Inter', sans-serif"
            },
            bodyFont: {
              size: 13,
              family: "'Inter', sans-serif"
            },
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (items) => {
                if (items.length > 0) {
                  return items[0].label || '';
                }
                return '';
              },
              label: (context) => {
                const value = context.parsed.y;
                if (value === null || value === undefined) return '';
                const sign = value >= 0 ? '+' : '';
                return `Сумма: ${sign}${value.toFixed(2)} ₽`;
              },
              afterLabel: (context) => {
                const index = context.dataIndex;
                if (index >= 0 && index < this.data.length) {
                  const change = this.data[index];
                  if (change !== 0) {
                    const sign = change >= 0 ? '+' : '';
                    return `Изменение: ${sign}${change.toFixed(2)} ₽`;
                  }
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              color: 'rgba(0, 0, 0, 0.6)',
              padding: 8
            }
          },
          y: {
            display: true,
            beginAtZero: false,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            border: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              color: 'rgba(0, 0, 0, 0.6)',
              padding: 8,
              callback: (value) => {
                if (typeof value === 'number') {
                  // Форматируем большие числа
                  if (Math.abs(value) >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M ₽`;
                  } else if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(1)}K ₽`;
                  }
                  return `${value.toFixed(0)} ₽`;
                }
                return value;
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          line: {
            borderJoinStyle: 'round' as const,
            borderCapStyle: 'round' as const
          },
          point: {
            hoverBorderWidth: 3
          }
        }
      }
    };

    try {
      this.chart = new Chart(this.canvas.nativeElement, config);
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  /**
   * Вычисляет кумулятивные данные (накопление суммы)
   * @param data - массив значений
   * @returns массив кумулятивных значений
   */
  private calculateCumulativeData(data: number[]): number[] {
    if (data.length === 0) return [];
    
    const cumulative: number[] = [];
    let sum = 0;
    
    for (const value of data) {
      sum += value;
      cumulative.push(sum);
    }
    
    return cumulative;
  }

  /**
   * Обновление данных графика
   */
  private updateChart(): void {
    if (!this.chart || !this.canvas?.nativeElement) {
      // Если график не инициализирован, но есть данные, инициализируем его
      if (this.labels.length > 0 && this.data.length > 0) {
        requestAnimationFrame(() => {
          if (!this.chart && this.canvas?.nativeElement) {
            this.initChart();
          }
        });
      }
      return;
    }

    try {
      // Вычисляем кумулятивные данные
      const cumulativeData = this.calculateCumulativeData(this.data);
      
      // Обновляем данные
      this.chart.data.labels = this.labels.length > 0 ? this.labels : [];
      this.chart.data.datasets[0].data = cumulativeData.length > 0 ? cumulativeData : [];
      
      // Обновляем размер точек в зависимости от количества данных
      const dataset = this.chart.data.datasets[0] as any;
      if (this.data.length > 20) {
        dataset.pointRadius = 0;
      } else {
        dataset.pointRadius = 4;
      }
      
      // Обновляем график с анимацией
      this.chart.update('active');
    } catch (error) {
      console.error('Error updating chart:', error);
      // При ошибке переинициализируем график
      this.initChart();
    }
  }

  /**
   * Переключение периода агрегации
   * @param period - новый период
   */
  onPeriodChange(period: PeriodType): void {
    if (this.period !== period) {
      this.periodChange.emit(period);
    }
  }

  /**
   * Проверка наличия данных для отображения
   */
  get hasData(): boolean {
    return this.data.length > 0 && this.labels.length > 0;
  }

  /**
   * Очистка ресурсов при уничтожении компонента
   */
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null as any;
    }
  }
}
