import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RickyService } from './ricky-service';

describe('RickyService', () => {
  let component: RickyService;
  let fixture: ComponentFixture<RickyService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RickyService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RickyService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
