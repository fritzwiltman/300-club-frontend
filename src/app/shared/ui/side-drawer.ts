import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardService, Season, Theme, ThemeService, UserService } from '../../core/services';

@Component({
  selector: 'app-side-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './side-drawer.html',
  styleUrl: './side-drawer.scss',
})
export class SideDrawerComponent {
  protected readonly userService = inject(UserService);
  protected readonly leaderboardService = inject(LeaderboardService);
  protected readonly themeService = inject(ThemeService);

  readonly close = output<void>();

  protected readonly themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { value: 'light', label: 'Light', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
    { value: 'dark', label: 'Dark', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
  ];

  private readonly drawerContent = viewChild<ElementRef<HTMLDivElement>>('drawerContent');

  constructor() {
    // Focus the drawer when opened
    setTimeout(() => {
      this.drawerContent()?.nativeElement.focus();
    }, 0);
  }

  protected onSeasonSelect(season: Season): void {
    this.leaderboardService.setSeason(season);
  }

  protected onChangeUser(): void {
    this.close.emit();
    this.userService.clearUser();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
