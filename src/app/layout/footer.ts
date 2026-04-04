import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <footer class="bg-club-forest text-white py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center gap-4">
          <!-- Arlo Mascot -->
          <img
            ngSrc="arlo.png"
            alt="Arlo - The Three Hundred Club Mascot"
            width="120"
            height="120"
            class="rounded-full bg-white p-1"
          />

          <!-- Copyright -->
          <p class="text-sm text-club-sage text-center">
            &copy; {{ currentYear }} Good Boy Devs
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
