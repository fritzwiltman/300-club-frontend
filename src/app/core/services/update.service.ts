import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate);

  private readonly _updateAvailable = signal(false);
  readonly updateAvailable = this._updateAvailable.asReadonly();

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    if (!this.isBrowser || !this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this._updateAvailable.set(true);
      }
    });
  }

  async activateUpdateAndReload(): Promise<void> {
    if (!this.isBrowser || !this.swUpdate.isEnabled) return;

    await this.swUpdate.activateUpdate();
    document.location.reload();
  }
}
