import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistCard } from './artist-card';

describe('ArtistCard', () => {
  let component: ArtistCard;
  let fixture: ComponentFixture<ArtistCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtistCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtistCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
