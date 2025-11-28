import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchList } from './search-list';

describe('SearchList', () => {
  let component: SearchList;
  let fixture: ComponentFixture<SearchList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
