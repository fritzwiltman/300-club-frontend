import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { User } from '../../core/models';
import { UserService } from '../../core/services';

@Component({
  selector: 'app-user-select-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: {
    '(keydown.escape)': 'onEscapeKey()',
  },
  templateUrl: './user-select-modal.html',
})
export class UserSelectModalComponent {
  protected readonly userService = inject(UserService);

  readonly userSelected = output<User>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  protected readonly filteredUsers = computed(() => {
    const users = this.userService.users();
    const search = this.searchValue().toLowerCase().trim();

    if (!search) {
      return users;
    }

    return users.filter((user) => user.name.toLowerCase().includes(search));
  });

  constructor() {
    // Focus search input when modal opens
    effect(() => {
      const input = this.searchInput();
      if (input) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => input.nativeElement.focus(), 0);
      }
    });

    // Load users on init
    this.userService.loadUsers().subscribe();
  }

  protected selectUser(user: User): void {
    this.userService.selectUser(user);
    this.userSelected.emit(user);
  }

  protected onEscapeKey(): void {
    // Modal cannot be dismissed without selecting a user
    // Focus the search input instead
    this.searchInput()?.nativeElement.focus();
  }
}
