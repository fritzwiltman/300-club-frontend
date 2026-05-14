import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UpdateService } from '../../core/services';

@Component({
  selector: 'app-update-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './update-banner.html',
})
export class UpdateBannerComponent {
  private readonly updateService = inject(UpdateService);

  protected readonly updateAvailable = this.updateService.updateAvailable;
  protected readonly dismissed = signal(false);

  protected dismiss(): void {
    this.dismissed.set(true);
  }

  protected refresh(): void {
    void this.updateService.activateUpdateAndReload();
  }
}

