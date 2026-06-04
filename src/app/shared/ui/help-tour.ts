import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { HelpTourService, TourStep } from '../../core/services/help-tour.service';

interface TooltipPosition {
  top: string;
  left: string;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-help-tour',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-tour.html',
})
export class HelpTourComponent {
  protected readonly tourService = inject(HelpTourService);

  protected readonly spotlightPosition = signal<SpotlightPosition | null>(null);
  protected readonly tooltipPosition = signal<TooltipPosition | null>(null);

  protected readonly isActive = this.tourService.isActive;
  protected readonly currentStepIndex = this.tourService.currentStepIndex;
  protected readonly steps = this.tourService.steps;

  protected readonly currentStep = computed(() => {
    const steps = this.steps();
    const index = this.currentStepIndex();
    return steps[index] ?? null;
  });

  protected readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  protected readonly isLastStep = computed(() => {
    const steps = this.steps();
    return this.currentStepIndex() === steps.length - 1;
  });

  protected readonly stepProgress = computed(() => {
    const total = this.steps().length;
    const current = this.currentStepIndex() + 1;
    return `${current} of ${total}`;
  });

  constructor() {
    // Update positions when step changes
    effect(() => {
      const step = this.currentStep();
      const isActive = this.isActive();
      if (isActive && step) {
        // Small delay to ensure DOM is ready
        setTimeout(() => this.updatePositions(step), 50);
      }
    });
  }

  private updatePositions(step: TourStep): void {
    const target = document.querySelector(step.targetSelector);
    if (!target) {
      // If target not found, skip to next step or close
      console.warn(`Tour target not found: ${step.targetSelector}`);
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Spotlight position
    this.spotlightPosition.set({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Tooltip position
    const tooltipWidth = 320;
    const tooltipHeight = 180; // Approximate
    const gap = 16;

    let top: number;
    let left: number;
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right';

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + gap + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
        break;
      case 'top':
        top = rect.top - tooltipHeight - gap + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'bottom';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.left - tooltipWidth - gap;
        arrowPosition = 'right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.right + gap;
        arrowPosition = 'left';
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) {
      left = viewportWidth - tooltipWidth - 16;
    }

    this.tooltipPosition.set({
      top: `${top}px`,
      left: `${left}px`,
      arrowPosition,
    });
  }

  protected onNext(): void {
    this.tourService.nextStep();
  }

  protected onPrevious(): void {
    this.tourService.previousStep();
  }

  protected onClose(): void {
    this.tourService.closeTour();
  }

  protected onComplete(): void {
    this.tourService.completeTour();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isActive()) {
      this.onClose();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    const step = this.currentStep();
    if (this.isActive() && step) {
      this.updatePositions(step);
    }
  }
}
