import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

const FORMSPREE_URL = 'https://formspree.io/f/xojrolke';

type FeedbackType = 'Bug Report' | 'Feature Request' | 'Other';

@Component({
  selector: 'app-feedback-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: {
    class: 'block',
  },
  template: `
    <!-- Feedback Button (fixed bottom-right) -->
    <button
      type="button"
      (click)="openModal()"
      class="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2
             bg-club-forest dark:bg-gray-800 text-white rounded-full shadow-lg
             hover:bg-club-green dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2
             focus-visible:ring-club-lime focus-visible:ring-offset-2
             transition-colors"
      aria-label="Send feedback"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span class="hidden sm:inline text-sm font-medium">Feedback</span>
    </button>

    <!-- Modal Backdrop -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <!-- Modal Content -->
        <div
          class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl
                 transform transition-all"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="feedback-title" class="text-lg font-semibold text-club-forest dark:text-white">
              Send Feedback
            </h2>
            <button
              type="button"
              (click)="closeModal()"
              class="p-1 text-club-gray hover:text-club-forest dark:hover:text-white
                     rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Success State -->
          @if (isSuccess()) {
            <div class="px-6 py-12 text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-club-lime/20 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-club-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-club-forest dark:text-white mb-2">
                Thanks for your feedback!
              </h3>
              <p class="text-sm text-club-gray">
                We appreciate you taking the time to help us improve.
              </p>
            </div>
          } @else {
            <!-- Form -->
            <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()" class="px-6 py-4 space-y-4">
              <!-- Error Message -->
              @if (errorMessage()) {
                <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                            rounded-lg text-sm text-red-700 dark:text-red-300" role="alert">
                  {{ errorMessage() }}
                </div>
              }

              <!-- Feedback Type -->
              <div>
                <label for="feedback-type" class="block text-sm font-medium text-club-forest dark:text-gray-200 mb-1">
                  Feedback Type
                </label>
                <select
                  id="feedback-type"
                  formControlName="type"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-club-forest dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime"
                >
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <!-- Message -->
              <div>
                <label for="feedback-message" class="block text-sm font-medium text-club-forest dark:text-gray-200 mb-1">
                  Message <span class="text-club-burgundy">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  formControlName="message"
                  rows="4"
                  placeholder="Tell us what's on your mind..."
                  class="w-full px-3 py-2 border rounded-lg resize-none
                         bg-white dark:bg-gray-700 text-club-forest dark:text-white
                         placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime"
                  [class.border-gray-300]="!feedbackForm.controls.message.touched || feedbackForm.controls.message.valid"
                  [class.dark:border-gray-600]="!feedbackForm.controls.message.touched || feedbackForm.controls.message.valid"
                  [class.border-red-500]="feedbackForm.controls.message.touched && feedbackForm.controls.message.invalid"
                ></textarea>
                @if (feedbackForm.controls.message.touched && feedbackForm.controls.message.errors?.['required']) {
                  <p class="mt-1 text-xs text-club-burgundy">Please enter a message</p>
                }
              </div>

              <!-- Email (optional) -->
              <div>
                <label for="feedback-email" class="block text-sm font-medium text-club-forest dark:text-gray-200 mb-1">
                  Email <span class="text-club-gray text-xs">(optional)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  formControlName="email"
                  placeholder="your@email.com"
                  class="w-full px-3 py-2 border rounded-lg
                         bg-white dark:bg-gray-700 text-club-forest dark:text-white
                         placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime"
                  [class.border-gray-300]="!feedbackForm.controls.email.touched || feedbackForm.controls.email.valid"
                  [class.dark:border-gray-600]="!feedbackForm.controls.email.touched || feedbackForm.controls.email.valid"
                  [class.border-red-500]="feedbackForm.controls.email.touched && feedbackForm.controls.email.invalid"
                />
                @if (feedbackForm.controls.email.touched && feedbackForm.controls.email.errors?.['email']) {
                  <p class="mt-1 text-xs text-club-burgundy">Please enter a valid email</p>
                }
              </div>

              <!-- Submit Button -->
              <div class="pt-2">
                <button
                  type="submit"
                  [disabled]="isSubmitting() || feedbackForm.invalid"
                  class="w-full px-4 py-2.5 bg-club-forest dark:bg-club-lime text-white dark:text-club-forest font-medium rounded-lg
                         hover:bg-club-green dark:hover:bg-club-sage focus:outline-none focus-visible:ring-2
                         focus-visible:ring-club-lime focus-visible:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
                >
                  @if (isSubmitting()) {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  } @else {
                    Send Feedback
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
})
export class FeedbackModalComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  protected readonly isOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isSuccess = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly feedbackForm = this.fb.nonNullable.group({
    type: ['Bug Report' as FeedbackType],
    message: ['', [Validators.required, Validators.minLength(10)]],
    email: ['', [Validators.email]],
  });

  protected openModal(): void {
    this.isOpen.set(true);
    this.isSuccess.set(false);
    this.errorMessage.set(null);
    this.feedbackForm.reset({ type: 'Bug Report', message: '', email: '' });
  }

  protected closeModal(): void {
    this.isOpen.set(false);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen()) {
      this.closeModal();
    }
  }

  protected onSubmit(): void {
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.feedbackForm.getRawValue();
    const payload: Record<string, string> = {
      type: formValue.type,
      message: formValue.message,
    };

    // Only include email if provided
    if (formValue.email) {
      payload['email'] = formValue.email;
    }

    this.http
      .post(FORMSPREE_URL, payload, {
        headers: { Accept: 'application/json' },
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isSuccess.set(true);

          // Auto-close after 2 seconds
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.error ?? 'Failed to send feedback. Please try again.'
          );
        },
      });
  }
}
