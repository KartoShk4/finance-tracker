import {
  Component,
  Input,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';

export interface CategoryChartData {
  id: string;
  title: string;
  income: number;
  expense: number;
  total: number;
}

/**
 * Компонент графика категорий
 * Отображает все категории с их доходами и расходами
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-categories-chart',
  templateUrl: './categories-chart.component.html' ,
  styleUrl: './categories-chart.component.scss',
})
export class CategoriesChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() categories: CategoryChartData[] = [];

  @ViewChild('canvas', { static: false })
  canvas!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;

  hasData(): boolean {
    return this.categories.length > 0 && this.categories.some(cat => cat.income > 0 || cat.expense > 0);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.canvas?.nativeElement && this.hasData()) {
        this.initChart();
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.chart) {
          if (this.canvas?.nativeElement && this.hasData()) {
            this.initChart();
          }
          return;
        }

        if (changes['categories']) {
          this.updateChart();
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null as any;
    }
  }

  private initChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null as any;
    }

    if (!this.canvas?.nativeElement || !this.hasData()) {
      return;
    }

    // Сортируем категории по общей сумме (по модулю)
    const sortedCategories = [...this.categories].sort((a, b) => {
      const totalA = Math.abs(a.total);
      const totalB = Math.abs(b.total);
      return totalB - totalA;
    });

    // Берем топ-10 категорий для читаемости
    const topCategories = sortedCategories.slice(0, 10);

    const labels = topCategories.map(cat => cat.title);
    const incomeData = topCategories.map(cat => cat.income || 0);
    const expenseData = topCategories.map(cat => Math.abs(cat.expense || 0));

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Доходы',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2
          },
          {
            label: 'Расходы',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString('ru-RU') + ' ₽';
              },
              color: '#FFFFFF',
              font: {
                family: "'Inter', sans-serif"
              }
            },
            grid: {
              color: 'rgba(251,251,251,0.1)' // Светло-серые линии сетки
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              color: '#FFFFFF',
              font: {
                family: "'Inter', sans-serif"
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)' // Светло-серые линии сетки
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              color: '#FFFFFF',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
              family: "'Inter', sans-serif"
            },
            bodyFont: {
              size: 13,
              family: "'Inter', sans-serif",
            },
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: ${value.toLocaleString('ru-RU')} ₽`;
              }
            }
          }
        }
      }
    };

    try {
      this.chart = new Chart(this.canvas.nativeElement, config);
    } catch (error) {
      console.error('Error initializing categories chart:', error);
    }
  }

  private updateChart(): void {
    if (!this.chart || !this.canvas?.nativeElement) {
      if (this.hasData()) {
        this.initChart();
      }
      return;
    }

    try {
      // Сортируем категории по общей сумме
      const sortedCategories = [...this.categories].sort((a, b) => {
        const totalA = Math.abs(a.total);
        const totalB = Math.abs(b.total);
        return totalB - totalA;
      });

      const topCategories = sortedCategories.slice(0, 10);

      const labels = topCategories.map(cat => cat.title);
      const incomeData = topCategories.map(cat => cat.income || 0);
      const expenseData = topCategories.map(cat => Math.abs(cat.expense || 0));

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = incomeData;
      this.chart.data.datasets[1].data = expenseData;

      if (!this.hasData()) {
        this.chart.destroy();
        this.chart = null as any;
        return;
      }

      this.chart.update('active');
    } catch (error) {
      console.error('Error updating categories chart:', error);
      this.initChart();
    }
  }
}

