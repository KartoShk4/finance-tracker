import {Component, inject} from '@angular/core';
import { RouterOutlet} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FloatingOneTapComponent } from './shared/components/floating-one-tap/floating-one-tap.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
import {HeaderComponent} from './shared/components/header/header.component';
import {VkAuthService} from './core/auth/auth.service';

/**
 * Корневой компонент приложения
 * Содержит основную структуру приложения (шапка и контент)
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FloatingOneTapComponent,
    HeaderComponent,
    FooterComponent,
    SnackbarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  authService = inject(VkAuthService);
}
