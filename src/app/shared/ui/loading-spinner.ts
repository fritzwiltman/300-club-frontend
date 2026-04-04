import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-busy]': 'true',
    '[attr.aria-live]': '"polite"',
    class: 'flex items-center justify-center',
  },
  template: `
    <div class="flex flex-col items-center gap-3">
      <div
        class="w-10 h-10 border-4 border-club-sage border-t-club-lime rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      ></div>
      @if (message()) {
        <p class="text-sm text-club-gray">{{ message() }}</p>
      }
      <span class="sr-only">Loading, please wait...</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly message = input<string>('');
}
