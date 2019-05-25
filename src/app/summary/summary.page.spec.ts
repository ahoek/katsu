import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryPage } from './summary.page';

describe('SummaryPage', () => {
  let component: SummaryPage;
  let fixture: ComponentFixture<SummaryPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SummaryPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
