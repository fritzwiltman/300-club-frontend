import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { SideDrawerComponent } from '../shared/ui';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, SideDrawerComponent],
  host: {
    class: 'block',
  },
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  protected readonly isDrawerOpen = signal(false);

  protected openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }
}
