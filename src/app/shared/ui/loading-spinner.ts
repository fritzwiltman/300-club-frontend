import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-busy]': 'true',
    '[attr.aria-live]': '"polite"',
    class: 'flex items-center justify-center',
  },
  templateUrl: './loading-spinner.html',
})
export class LoadingSpinnerComponent {
  readonly message = input<string>('');
}
