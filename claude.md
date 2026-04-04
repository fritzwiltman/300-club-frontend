# 300 Club Frontend - Project Context

## Project Overview

A read-only Angular frontend for 300 Club, a baseball competition leaderboard app for ~90 friends/family. Displays leaderboards for 7 competition categories with ESPN Tournament Challenge-inspired design.

**Key Characteristics:**
- Read-only app (no data mutations)
- No authentication - user selection via localStorage
- Mobile-first, responsive design
- ~90 contestants total

## Technical Stack

| Technology | Version | Notes |
|------------|---------|-------|
| Angular | 21 | Standalone components (default, no `standalone: true` needed) |
| TypeScript | 5.9 | Strict mode enabled |
| Tailwind CSS | 4.x | Via @tailwindcss/postcss |
| RxJS | 7.8 | For HTTP, NO NgRx |
| Node | 20+ | Package manager: npm 11.6.2 |

## Backend API

**Base URL:** `http://localhost:8000/leaderboard`

### Endpoints

| Endpoint | Purpose | Key Fields |
|----------|---------|------------|
| `GET /users/` | List all contestants | `mbr_id`, `name` |
| `GET /batters/?season=YYYY` | Batting avg leaderboard | `user_name`, `aggregate_average`, `rank`, `qualified_picks[]` |
| `GET /ops/` | OPS leaderboard | `user_name`, `aggregate_ops`, `rank` |
| `GET /homeruns/` | Home runs (top 3 of 4) | `user_name`, `top_three_total_homeruns`, `rank` |
| `GET /pitchers/` | Pitchers wins (top 3 of 4) | `user_name`, `top_three_total_wins`, `rank` |
| `GET /rbi-champion/` | RBI prediction | `actual_rbi_leader`, `leaderboard[]` |
| `GET /stolen-bases/` | Stolen bases prediction | `actual_sb_leader`, `leaderboard[]` |
| `GET /dimaggio/` | Hitting streak prediction | `actual_longest_streak`, `leaderboard[]` |
| `GET /categories/` | Category metadata | `id`, `name`, `display_name`, `description` |

**Notes:**
- All endpoints support optional `?season=YYYY` query param (defaults to current season)
- `rank: 0` indicates disqualified user
- Disqualified users should appear at bottom, grayed out with DQ badge

## Color Palette (from 300club.org)

```css
/* Primary */
--color-lime: #7CD344;      /* Primary accent, CTAs, active states */
--color-sage: #a8e1a8;      /* Secondary backgrounds, hover states */
--color-forest: #003300;    /* Primary text */
--color-green: #008000;     /* Borders, icons */

/* Accent */
--color-burgundy: #B03232;  /* Error states, DQ badges */

/* Neutral */
--color-white: #FFFFFF;     /* Card backgrounds */
--color-gray: #666666;      /* Secondary text, disabled states */
--color-black: #000000;     /* Headings */
```

## Angular Best Practices (MUST FOLLOW)

### Components
- Always use `ChangeDetection.OnPush`
- Use `input()` and `output()` functions, NOT decorators
- Use `computed()` for derived state
- Do NOT set `standalone: true` (default in Angular 20+)
- Use `host` object in decorator, NOT `@HostBinding`/`@HostListener`
- Prefer inline templates for small components
- Use Reactive forms, NOT template-driven

### State Management
- Use `signal()` for local state
- Use `computed()` for derived state
- Use `update()` or `set()`, NOT `mutate()`
- NO BehaviorSubject - use signals instead

### Services
- Use `inject()` function, NOT constructor injection
- Use `providedIn: 'root'` for singletons

### Templates
- Use native control flow: `@if`, `@for`, `@switch`
- Use `class` bindings, NOT `ngClass`
- Use `style` bindings, NOT `ngStyle`
- Use async pipe for observables

### Routing
- Lazy load all feature routes with `loadComponent()` / `loadChildren()`
- Use route titles for browser tab

### Images
- Use `NgOptimizedImage` for all static images
- Does NOT work for inline base64

## Accessibility Requirements

- Must pass all AXE checks
- WCAG AA compliance minimum
- Focus management: visible focus rings (`focus:ring-2`)
- Color contrast: 4.5:1 text, 3:1 UI components
- ARIA labels on interactive elements
- Keyboard navigation for all interactions
- Modal a11y: focus trap, Escape to close, `role="dialog"`, `aria-modal="true"`
- Screen reader: semantic HTML, `aria-live` for dynamic content

## Folder Structure

```
src/app/
├── core/
│   ├── services/
│   │   ├── user.service.ts         # Signals-based user state
│   │   └── leaderboard.service.ts  # API calls
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── category.model.ts
│   │   └── leaderboard.model.ts
│   └── interceptors/
│       └── api.interceptor.ts      # Base URL
├── shared/
│   └── ui/
│       ├── category-card.ts
│       ├── user-select-modal.ts
│       └── loading-spinner.ts
├── layout/
│   ├── navbar.ts
│   └── layout.ts
├── features/
│   ├── home/
│   │   ├── home.routes.ts
│   │   └── home.ts
│   ├── leaderboard/
│   │   ├── leaderboard.routes.ts
│   │   └── leaderboard.ts
│   └── user-profile/
│       ├── user-profile.routes.ts
│       └── user-profile.ts
├── app.routes.ts
├── app.config.ts
└── app.ts
```

## The 7 Categories

| Category | Slug | Scoring | Unit | Tiebreakers |
|----------|------|---------|------|-------------|
| Batters | `batters` | Aggregate batting average of qualified picks | AVG | Alternates' Average |
| OPS | `ops` | Aggregate OPS of picks | OPS | Alternates' OPS |
| Home Runs | `homeruns` | Top 3 of 4 picked players' HRs | HRs | 1) 4th pick HRs, 2) Alternates' Average |
| Pitchers | `pitchers` | Top 3 of 4 pitchers' wins | Wins | 1) 4th pitcher wins, 2) Won-lost avg, 3) ERA, 4) Alternates' Average |
| RBI Champion | `rbi-champion` | Predict MLB RBI leader | RBIs | Alternates' Average |
| Stolen Base Champion | `stolen-bases` | Predict MLB SB leader | SBs | Alternates' Average |
| DiMaggio | `dimaggio` | Predict longest hitting streak | Games | Alternates' Average |

### Category Rules

**Batters**: Alternates automatically replace any of your regular 10 batters who fail to reach minimum plate appearances (pro-rated weekly). Alternates must meet minimum PA to be used.

**Home Runs / Pitchers**: Top 3 of 4 picks count; 4th is first tiebreaker.

**Prediction Categories** (RBI, SB, DiMaggio): Member choosing correct player closest to actual result wins.

## Key Decisions Made

1. **User Selection**: No auth - select name from list, stored in localStorage (`300club_user`)
2. **State Management**: Signals only, no BehaviorSubject/NgRx
3. **User List**: Alphabetical with search filter, ~90 users
4. **Disqualified Users**: Show at bottom, grayed out with burgundy "DQ" badge
5. **Design**: ESPN Tournament Challenge inspired, mobile-first
6. **Routing**: Lazy load all features
7. **Name Display**: Transform "Lastname, Firstname" → "Firstname Lastname" in model mapping
8. **Mascot**: Arlo the goldendoodle (`arlo.png`) - footer logo and favicon

## Phase Breakdown

### Phase 1 (COMPLETE)
- [x] App configuration (HttpClient, interceptor, proxy for CORS)
- [x] Core models and services (UserService with signals, LeaderboardService)
- [x] Layout (Navbar with classic 300club.org header image)
- [x] User selection modal (search filter, focus trap, accessibility)
- [x] Home page with 7 category cards showing user rank/points
- [x] Full leaderboard page (all 7 categories working)
  - User highlighting, DQ badges, sorted standings
  - Responsive table with horizontal scroll safety
- [x] Routing with lazy loading
- [x] Mobile responsive (tested at 375px)
- [x] SSR-safe localStorage with `isPlatformBrowser()`
- [x] Tailwind color theme from 300club.org

### Phase 2 (COMPLETE)

**Data Transformations:**
- [x] Transform names: "Lastname, Firstname" → "Firstname Lastname" (everywhere via `formatDisplayName()`)
- [x] Display minimum plate appearances requirement (502 PA for batters/OPS)

**Tiebreaker Columns:**
- [x] Batters: Alternates' Average column
- [x] OPS: Alternates' Average column (reuses batter alternates)
- [x] Home Runs: 4th pick HRs column, Alternates' Average
- [x] Pitchers: 4th pitcher wins, W-L%, ERA, Alternates' Average
- [x] RBI Champion: Pick, Diff from actual, Alternates' Average
- [x] Stolen Bases: Pick, Diff from actual, Alternates' Average
- [x] DiMaggio: Alternates' Average column

**UI Enhancements:**
- [x] Expandable rows: Click row to show user's picks for that category
  - Batters/OPS: Shows qualified picks with AVG/OPS, disqualified with PA count
  - Home Runs: Shows HR picks + alternate batters
  - Pitchers: Shows pitcher picks with W-L, ERA, K stats
- [x] User position card pinned at top of leaderboard
  - Shows rank, points, and alternates average
  - Disqualified users see DQ badge

**Branding:**
- [x] Arlo mascot (`arlo.png`) in footer
- [x] Favicon set to Arlo mascot
- [x] Footer component with Arlo and copyright

### Phase 3: User Profile & Advanced Features (COMPLETE)
- [x] User profile page (`/user/:userId`) showing all 7 category standings
- [x] User comparison modal (side-by-side picks)
- [x] Season selector (2024/2025)
- [x] Enhanced accessibility audit
- [x] Category rules tooltip/popup (explain rules and tiebreakers for each category)

### Phase 4: Trend Analysis
- [ ] Week-over-week trend indicators

### UI Polish (anytime)
- [ ] Header banner max-width: Set max-width for header image and page container to prevent stretching beyond viewport
- [ ] Header image quality: Current image is blurry - create/source a new higher-res version
- [ ] Navbar/table alignment: Navbar is wider than leaderboard table - align widths
- [ ] Mobile table fit: Table must fit without horizontal scroll at iPhone min width (390px)
- [ ] Player stats layout:
  - Mobile: Horizontal scrolling carousel at top of page (top 15 in category)
  - Desktop: Separate container to the right of the leaderboard
- [x] Remove Home button from navbar: Redundant since leaderboard pages have "< Back to Home"
- [ ] (Nice-to-have) Team theme selector: Allow user to select favorite MLB team, update app color theme based on team colors

## TypeScript Models

```typescript
// User
interface User {
  readonly mbrId: number;
  readonly name: string;
}

// Category
type CategorySlug = 'batters' | 'ops' | 'homeruns' | 'pitchers' | 'rbi-champion' | 'stolen-bases' | 'dimaggio';

interface Category {
  readonly slug: CategorySlug;
  readonly displayName: string;
  readonly description: string;
  readonly unit: string;
  readonly minPlateAppearances?: number; // 502 for batters/OPS
}

// Pick types for expandable rows
interface BatterPick {
  readonly playerName: string;
  readonly average: number;
  readonly ops: number;
  readonly isDisqualified?: boolean;
  readonly plateAppearances?: number;
}

interface HomerunPick {
  readonly playerName: string;
  readonly homeRuns: number;
}

interface PitcherPick {
  readonly playerName: string;
  readonly wins: number;
  readonly losses: number;
  readonly era: number;
  readonly strikeouts: number;
}

interface AlternatePick {
  readonly playerName: string;
  readonly average: number;
  readonly isDisqualified: boolean;
}

// Leaderboard
interface UserStanding {
  readonly userName: string;
  readonly rank: number;
  readonly points: number | null;
  readonly isDisqualified: boolean;
  // Tiebreaker fields
  readonly alternatesAverage?: number | null;
  readonly alternatesOps?: number | null;
  readonly fourthPickValue?: number | null;
  readonly winLossPct?: number | null;
  readonly era?: number | null;
  // Prediction categories
  readonly predictedPlayer?: string;
  readonly actualDifference?: number | null;
  readonly isCorrectPlayer?: boolean;
  // Picks for expandable rows
  readonly batterPicks?: readonly BatterPick[];
  readonly homerunPicks?: readonly HomerunPick[];
  readonly pitcherPicks?: readonly PitcherPick[];
  readonly alternatePicks?: readonly AlternatePick[];
}

interface CategorySummary {
  readonly category: CategorySlug;
  readonly displayName: string;
  readonly unit: string;
  readonly userRank: number | null;
  readonly userPoints: number | null;
  readonly totalParticipants: number;
}
```

## Commands

```bash
# Development
npm start              # ng serve (http://localhost:4200) with proxy
npm run build          # Production build
npm test               # Run tests (vitest)

# Backend (separate terminal)
cd ../300-club && python3 manage.py runserver  # http://localhost:8000
```

## Development Proxy

API requests are proxied in development to avoid CORS issues:
- Config file: `proxy.conf.json`
- Requests to `/leaderboard/*` are forwarded to `http://localhost:8000`
- No CORS headers needed on backend during development

## Issues Resolved in Phase 1

1. **CORS errors**: Backend doesn't send CORS headers. Resolved with `proxy.conf.json` forwarding `/leaderboard/*` to Django.
2. **SSR localStorage error**: `localStorage.removeItem is not a function` in SSR. Resolved with `isPlatformBrowser()` check.
3. **Vite cache stale**: `ERR_OUTDATED_OPTIMIZED_DEP` after code changes. Resolved by clearing `.angular/cache/`.
4. **Dynamic route prerendering**: Routes with params can't prerender. Resolved with `RenderMode.Client` in `app.routes.server.ts`.

## Notes

- Backend returns snake_case, frontend uses camelCase (transform in service)
- Season defaults to 2025, future: add season selector
- ~90 users total, no pagination needed
- All data is read-only, no mutations
