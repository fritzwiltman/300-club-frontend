import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models';
import { UserService } from '../../core/services';
import { LoadingSpinnerComponent } from '../../shared/ui';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent],
  templateUrl: './users.html',
})
export class UsersComponent {
  private readonly userService = inject(UserService);

  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(false);
  protected readonly users = this.userService.users;

  protected readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allUsers = this.users();

    if (!query) {
      return allUsers;
    }

    return allUsers.filter((user) =>
      user.name.toLowerCase().includes(query)
    );
  });

  constructor() {
    // Load users if not already loaded
    if (this.userService.users().length === 0) {
      this.isLoading.set(true);
      this.userService.loadUsers().subscribe({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false),
      });
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected isCurrentUser(user: User): boolean {
    const current = this.userService.currentUser();
    return current !== null && current.mbrId === user.mbrId;
  }

  protected getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
