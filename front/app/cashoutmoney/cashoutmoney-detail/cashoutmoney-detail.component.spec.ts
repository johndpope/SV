import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashoutmoneyDetailComponent } from './cashoutmoney-detail.component';

describe('CashoutmoneyDetailComponent', () => {
  let component: CashoutmoneyDetailComponent;
  let fixture: ComponentFixture<CashoutmoneyDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashoutmoneyDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashoutmoneyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
