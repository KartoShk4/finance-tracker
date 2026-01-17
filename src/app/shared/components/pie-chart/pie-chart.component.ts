import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Chart, ChartConfiguration} from 'chart.js/auto';

/**
 * Компонент круговой диаграммы
 * Отображает соотношение доходов и расходов
 */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss',
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
    // Используем setTimeout для гарантии, что DOM полностью готов
    setTimeout(() => {
      if (this.canvas?.nativeElement && this.hasData) {
        this.initChart();
      }
    }, 0);
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

    // Убеждаемся, что значения не undefined
    const incomeValue = this.income || 0;
    const expenseValue = Math.abs(this.expense || 0);

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut', // Используем тип doughnut для создания donut chart (bagel)
      data: {
        labels: ['Доходы', 'Расходы'],
        datasets: [
          {
            data: [incomeValue, expenseValue],
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
        cutout: '40%', // Размер внутреннего отверстия для donut chart
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
              family: "'Inter', sans-serif"
            },
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed ?? 0;

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
      // Обновляем данные графика
      const incomeValue = this.income || 0;
      const expenseValue = Math.abs(this.expense || 0);

      this.chart.data.datasets[0].data = [incomeValue, expenseValue];

      // Если данных нет, уничтожаем график
      if (!this.hasData) {
        this.chart.destroy();
        this.chart = null as any;
        return;
      }

      this.chart.update('active');
    } catch (error) {
      console.error('Error updating pie chart:', error);
      this.initChart();
    }
  }
}

