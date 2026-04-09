import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MlbLeader, CategorySlug } from '../../core/models';

@Component({
  selector: 'app-league-leaders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './league-leaders.html',
  styleUrl: './league-leaders.scss',
})
export class LeagueLeadersComponent {
  readonly leaders = input.required<MlbLeader[]>();
  readonly category = input.required<CategorySlug>();
  readonly userPicks = input<string[]>([]);

  private readonly userPicksLower = computed(() =>
    this.userPicks().map((name) => name.toLowerCase())
  );

  /**
   * Check if a player name matches one of the user's picks
   */
  isUserPick(playerName: string): boolean {
    return this.userPicksLower().includes(playerName.toLowerCase());
  }

  /**
   * Format full name to short form: "Aaron Judge" -> "A. Judge"
   */
  formatShortName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }

  /**
   * Get initials for fallback avatar
   */
  getInitials(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName.substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  /**
   * Format stat value based on category
   */
  formatValue(value: number): string {
    const category = this.category();

    // AVG and OPS: multiply by 1000 and show one decimal (0.331 → 331.0)
    if (category === 'batters' || category === 'ops') {
      return (value * 1000).toFixed(1);
    }

    // Counting stats (HR, Wins, RBI, SB) are integers
    return Math.round(value).toString();
  }
}
