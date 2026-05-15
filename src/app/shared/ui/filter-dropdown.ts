import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Category, SavedFilter } from '../../core/models';

@Component({
  selector: 'app-filter-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  host: {
    class: 'relative inline-flex flex-shrink-0',
  },
  templateUrl: './filter-dropdown.html',
})
export class FilterDropdownComponent {
  private readonly elementRef = inject(ElementRef);

  // Inputs
  readonly category = input.required<Category>();
  readonly allPlayerNames = input.required<readonly string[]>();
  readonly currentUserPickNames = input.required<readonly string[]>();
  readonly userNameFilters = input.required<readonly string[]>();
  readonly selectedPlayerFilters = input.required<Set<string>>();
  readonly savedFilters = input.required<readonly SavedFilter[]>();

  // Outputs
  readonly playerToggle = output<string>();
  readonly selectMyPlayers = output<void>();
  readonly saveFilter = output<{ name: string; userNameFilters: readonly string[]; playerFilters: readonly string[] }>();
  readonly deleteFilter = output<string>();
  readonly applyFilter = output<SavedFilter>();

  // Internal state
  protected readonly isOpen = signal(false);
  protected readonly showSaveInput = signal(false);
  protected readonly newFilterName = signal('');
  protected readonly showSavedFiltersSection = signal(true);

  // Form controls
  protected readonly playerSearchControl = new FormControl('', { nonNullable: true });

  // View children
  private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  // Computed
  protected readonly activeFilterCount = computed(() => {
    return this.userNameFilters().length + this.selectedPlayerFilters().size;
  });

  protected readonly hasActiveFilters = computed(() => {
    return this.activeFilterCount() > 0;
  });

  protected readonly filteredPlayerNames = computed(() => {
    const search = this.playerSearchControl.value.toLowerCase().trim();
    const allNames = this.allPlayerNames();
    if (!search) return allNames;
    return allNames.filter((name) => name.toLowerCase().includes(search));
  });

  protected readonly allMyPlayersSelected = computed(() => {
    const myPlayers = this.currentUserPickNames();
    if (myPlayers.length === 0) return false;
    const selectedFilters = this.selectedPlayerFilters();
    return myPlayers.every((p) => selectedFilters.has(p));
  });

  protected readonly hasSavedFilters = computed(() => {
    return this.savedFilters().length > 0;
  });

  protected toggle(): void {
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.resetState();
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.resetState();
    this.triggerButton()?.nativeElement.focus();
  }

  private resetState(): void {
    this.playerSearchControl.reset();
    this.showSaveInput.set(false);
    this.newFilterName.set('');
  }

  protected onPlayerToggle(playerName: string): void {
    this.playerToggle.emit(playerName);
  }

  protected onSelectMyPlayers(): void {
    this.selectMyPlayers.emit();
  }

  protected onApplyFilter(filter: SavedFilter): void {
    this.applyFilter.emit(filter);
    this.close();
  }

  protected onDeleteFilter(filterId: string, event: Event): void {
    event.stopPropagation();
    this.deleteFilter.emit(filterId);
  }

  protected toggleSaveInput(): void {
    this.showSaveInput.update((show) => !show);
    if (!this.showSaveInput()) {
      this.newFilterName.set('');
    }
  }

  protected onSaveFilter(): void {
    const name = this.newFilterName().trim();
    if (!name) return;

    this.saveFilter.emit({
      name,
      userNameFilters: this.userNameFilters(),
      playerFilters: Array.from(this.selectedPlayerFilters()),
    });

    this.showSaveInput.set(false);
    this.newFilterName.set('');
  }

  protected onSaveInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSaveFilter();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.toggleSaveInput();
    }
  }

  protected toggleSavedFiltersSection(): void {
    this.showSavedFiltersSection.update((show) => !show);
  }

  protected isPlayerSelected(playerName: string): boolean {
    return this.selectedPlayerFilters().has(playerName);
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
