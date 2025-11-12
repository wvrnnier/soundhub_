import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodCasts } from './pod-casts';

describe('PodCasts', () => {
  let component: PodCasts;
  let fixture: ComponentFixture<PodCasts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodCasts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodCasts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
