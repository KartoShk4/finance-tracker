import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  standalone: true,
  selector: 'app-chart',
  templateUrl: './chart.component.html'
})
export class ChartComponent implements AfterViewInit {

  @Input() labels: string[] = []; // Ось X (даты)
  @Input() data: number[] = [];   // Значения

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;

  ngAfterViewInit(): void {
    // Инициализация графика после появления canvas в DOM
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'Баланс',
            data: this.data,
            tension: 0.3
          }
        ]
      }
    });
  }
}
