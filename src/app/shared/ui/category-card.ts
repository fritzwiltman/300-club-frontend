import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategorySummary } from '../../core/models';

@Component({
  selector: 'app-category-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    class: 'block',
  },
  template: `
    <a
      [routerLink]="['/leaderboard', summary().category]"
      [attr.aria-label]="ariaLabel()"
      class="block h-full rounded-xl bg-white shadow-md p-5
             border-2 border-transparent
             hover:border-club-lime hover:shadow-lg
             focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime focus-visible:ring-offset-2
             transition-all duration-200"
    >
      <!-- Category Name -->
      <h2 class="text-lg font-bold text-club-forest">
        {{ summary().displayName }}
      </h2>

      <!-- Rank Display -->
      <div class="mt-3 flex items-baseline gap-2">
        @if (summary().userRank !== null) {
          <span class="text-4xl font-extrabold text-club-green">
            #{{ summary().userRank }}
          </span>
          <span class="text-sm text-club-gray">
            of {{ summary().totalParticipants }}
          </span>
        } @else {
          <span class="text-2xl font-bold text-club-burgundy">DQ</span>
          <span class="text-sm text-club-gray">Disqualified</span>
        }
      </div>

      <!-- Points -->
      <div class="mt-2">
        @if (summary().userPoints !== null) {
          <span class="text-lg font-semibold text-club-forest">
            {{ formattedPoints() }}
          </span>
          <span class="text-sm text-club-gray ml-1">
            {{ summary().unit }}
          </span>
        } @else {
          <span class="text-sm text-club-gray">No points</span>
        }
      </div>

      <!-- Leader Info -->
      @if (summary().leaderName) {
        <div class="mt-3 pt-3 border-t border-gray-100">
          <div class="flex items-center gap-1 text-xs text-club-gray">
            <svg class="w-3.5 h-3.5 text-club-lime" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>Leader:</span>
            <span class="font-medium text-club-forest truncate">{{ summary().leaderName }}</span>
            <span class="font-mono ml-auto">{{ formattedLeaderPoints() }}</span>
          </div>
        </div>
      }
    </a>
  `,
})
export class CategoryCardComponent {
  readonly summary = input.required<CategorySummary>();

  protected readonly ariaLabel = computed(() => {
    const s = this.summary();
    if (s.userRank !== null) {
      return `${s.displayName}: Ranked ${s.userRank} of ${s.totalParticipants}, ${this.formattedPoints()} ${s.unit}`;
    }
    return `${s.displayName}: Disqualified`;
  });

  protected readonly formattedPoints = computed(() => {
    const points = this.summary().userPoints;
    if (points === null) return '--';

    const category = this.summary().category;

    // Format based on category type
    if (category === 'batters' || category === 'ops') {
      // AVG and OPS use 3 decimal places without leading zero
      return points.toFixed(3);
    }

    // Integer values for HR, Wins, RBI, SB, Games
    return Math.round(points).toString();
  });

  protected readonly formattedLeaderPoints = computed(() => {
    const points = this.summary().leaderPoints;
    if (points === null) return '--';

    const category = this.summary().category;

    // Format based on category type
    if (category === 'batters' || category === 'ops') {
      return points.toFixed(3);
    }

    return Math.round(points).toString();
  });
}
