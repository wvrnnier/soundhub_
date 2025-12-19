import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackCarrusel } from './track-carrusel';

describe('TrackCarrusel', () => {
  let component: TrackCarrusel;
  let fixture: ComponentFixture<TrackCarrusel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackCarrusel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackCarrusel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
