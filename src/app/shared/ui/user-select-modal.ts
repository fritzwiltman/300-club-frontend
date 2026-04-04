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
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        aria-hidden="true"
      ></div>

      <!-- Modal Content -->
      <div
        #modalContent
        class="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" class="text-xl font-bold text-club-forest">
            Select Your Name
          </h2>
          <p class="mt-1 text-sm text-club-gray">
            Choose your name to view your standings
          </p>
        </div>

        <!-- Search -->
        <div class="px-6 py-3 border-b border-gray-100">
          <label for="user-search" class="sr-only">Search users</label>
          <input
            #searchInput
            id="user-search"
            type="search"
            [formControl]="searchControl"
            placeholder="Search by name..."
            autocomplete="off"
            class="w-full px-4 py-2 border border-gray-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-club-lime focus:border-club-lime
                   placeholder:text-gray-400"
          />
        </div>

        <!-- User List -->
        <div
          class="flex-1 overflow-y-auto px-2 py-2"
          role="listbox"
          aria-label="Users"
        >
          @if (userService.isLoading()) {
            <div class="flex items-center justify-center py-8" aria-live="polite">
              <span class="text-club-gray">Loading users...</span>
            </div>
          } @else if (filteredUsers().length === 0) {
            <div class="text-center py-8 text-club-gray" aria-live="polite">
              @if (searchValue()) {
                No users found matching "{{ searchValue() }}"
              } @else {
                No users available
              }
            </div>
          } @else {
            @for (user of filteredUsers(); track user.mbrId) {
              <button
                type="button"
                (click)="selectUser(user)"
                role="option"
                [attr.aria-selected]="false"
                class="w-full text-left px-4 py-3 rounded-md mb-1
                       hover:bg-club-sage/30 focus:bg-club-sage/30
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-club-lime
                       transition-colors"
              >
                <span class="font-medium text-club-forest">{{ user.name }}</span>
              </button>
            }
          }
        </div>
      </div>
    </div>
  `,
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
