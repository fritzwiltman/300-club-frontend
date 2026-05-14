import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Category } from '../../core/models';
import { LeaderboardService } from '../../core/services';

@Component({
  selector: 'app-rules-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative inline-block',
  },
  templateUrl: './rules-popover.html',
  styleUrl: './rules-popover.scss',
})
export class RulesPopoverComponent {
  private readonly leaderboardService = inject(LeaderboardService);

  readonly category = input.required<Category>();

  protected readonly isOpen = signal(false);

  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');
  private readonly popover = viewChild<ElementRef<HTMLDivElement>>('popover');
  private readonly elementRef = inject(ElementRef);

  /**
   * Get the prorated minimum plate appearances for the current season
   */
  protected readonly proratedMinPA = computed(() => {
    if (!this.category().minPlateAppearances) return null;
    return this.leaderboardService.getProratedMinPlateAppearances();
  });

  /**
   * Get the full season minimum plate appearances (502)
   */
  protected readonly fullSeasonMinPA = computed(() => {
    return this.category().minPlateAppearances ?? null;
  });

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
    // Return focus to trigger button
    this.triggerButton()?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.isOpen()) return;

    const target = event.target as HTMLElement;
    const hostElement = this.elementRef.nativeElement as HTMLElement;

    if (!hostElement.contains(target)) {
      this.close();
    }
  }
}
