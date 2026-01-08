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

/**
 * Компонент круговой диаграммы
 * Отображает соотношение доходов и расходов
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-pie-chart',
  template: `
    <div class="pie-chart-container">
      <h3 class="pie-chart-title">Общая статистика</h3>
      <div class="pie-chart-wrapper">
        <canvas #canvas></canvas>
      </div>
      <div *ngIf="!hasData" class="pie-chart-empty">
        Нет данных для отображения
      </div>
    </div>
  `,
  styles: [`
    .pie-chart-container {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }

    .pie-chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: var(--space-lg);
    }

    .pie-chart-wrapper {
      position: relative;
      height: 300px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pie-chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: var(--color-text-tertiary);
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .pie-chart-container {
        padding: var(--space-md);
      }

      .pie-chart-wrapper {
        height: 250px;
      }

      .pie-chart-empty {
        height: 250px;
      }
    }
  `]
})
export class PieChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() income: number = 0;
  @Input() expense: number = 0;

  @ViewChild('canvas', { static: false })
  canvas!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;

  get hasData(): boolean {
    return this.income > 0 || this.expense > 0;
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.canvas?.nativeElement && this.hasData) {
          this.initChart();
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.chart) {
          if (this.canvas?.nativeElement && this.hasData) {
            this.initChart();
          }
          return;
        }

        if (changes['income'] || changes['expense']) {
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

    if (!this.canvas?.nativeElement || !this.hasData) {
      return;
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Доходы', 'Расходы'],
        datasets: [
          {
            data: [this.income, Math.abs(this.expense)],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgb(16, 185, 129)',
              'rgb(239, 68, 68)'
            ],
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              color: 'var(--color-text-primary)',
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
              family: "'Inter', sans-serif"
            },
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const rawValue = context.parsed ?? 0;
                const value = typeof rawValue === 'number' ? rawValue : 0;

                const dataArray = (context.dataset.data as Array<number | null | undefined>);
                const total = dataArray.reduce((sum: number, current) => {
                  return sum + (typeof current === 'number' ? current : 0);
                }, 0);

                const totalNumber = total || 0;
                const percentage = totalNumber > 0 ? ((value / totalNumber) * 100).toFixed(1) : '0';
                return `${label}: ${value.toFixed(2)} ₽ (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    try {
      this.chart = new Chart(this.canvas.nativeElement, config);
    } catch (error) {
      console.error('Error initializing pie chart:', error);
    }
  }

  private updateChart(): void {
    if (!this.chart || !this.canvas?.nativeElement) {
      if (this.hasData) {
        this.initChart();
      }
      return;
    }

    try {
      this.chart.data.datasets[0].data = [this.income, Math.abs(this.expense)];
      this.chart.update('active');
    } catch (error) {
      console.error('Error updating pie chart:', error);
      this.initChart();
    }
  }
}

