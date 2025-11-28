import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportarMusica } from './importar-musica';

describe('ImportarMusica', () => {
  let component: ImportarMusica;
  let fixture: ComponentFixture<ImportarMusica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportarMusica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportarMusica);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
