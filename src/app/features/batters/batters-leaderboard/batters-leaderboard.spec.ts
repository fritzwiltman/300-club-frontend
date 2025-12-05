import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattersLeaderboard } from './batters-leaderboard';

describe('BattersLeaderboard', () => {
  let component: BattersLeaderboard;
  let fixture: ComponentFixture<BattersLeaderboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattersLeaderboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattersLeaderboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
