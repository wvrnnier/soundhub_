import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistCard } from './playlist-card';

describe('PlaylistCard', () => {
  let component: PlaylistCard;
  let fixture: ComponentFixture<PlaylistCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaylistCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
