import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar';
import { FooterComponent } from './footer';
import { ThemeService } from '../core/services';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  // Inject to ensure theme is initialized on app startup
  private readonly themeService = inject(ThemeService);
}
