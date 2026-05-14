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
  templateUrl: './category-card.html',
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

  protected getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
