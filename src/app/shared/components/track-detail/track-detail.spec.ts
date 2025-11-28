import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackDetailComponent } from './track-detail';
import { MusicService } from '../../../core/services/music-service';
import { AudioService } from '../../../core/services/audio-service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('TrackDetailComponent', () => {
  let component: TrackDetailComponent;
  let fixture: ComponentFixture<TrackDetailComponent>;
  let audioServiceSpy: jasmine.SpyObj<AudioService>;

  const mockTrack = {
    id: 1,
    title: 'Song Test',
    previewUrl: 'http://test.com/audio.mp3',
  };

  beforeEach(async () => {
    audioServiceSpy = jasmine.createSpyObj('AudioService', ['play']);

    await TestBed.configureTestingModule({
      imports: [TrackDetailComponent],
      providers: [
        {
          provide: MusicService,
          useValue: { getTrackById: () => of(mockTrack) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: AudioService, useValue: audioServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
