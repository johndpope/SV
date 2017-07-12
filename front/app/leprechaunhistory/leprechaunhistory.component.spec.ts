import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeprechaunhistoryComponent } from './leprechaunhistory.component';

describe('LeprechaunhistoryComponent', () => {
  let component: LeprechaunhistoryComponent;
  let fixture: ComponentFixture<LeprechaunhistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeprechaunhistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeprechaunhistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
