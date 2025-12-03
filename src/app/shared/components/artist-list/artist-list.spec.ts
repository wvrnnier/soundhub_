import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtistsListComponent } from './artist-list';

describe('ArtistList', () => {
  let component: ArtistsListComponent;
  let fixture: ComponentFixture<ArtistsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtistsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
