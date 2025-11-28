import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayList } from './play-list';

describe('PlayList', () => {
  let component: PlayList;
  let fixture: ComponentFixture<PlayList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
