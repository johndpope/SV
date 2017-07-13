import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashoutmoneyComponent } from './cashoutmoney.component';

describe('CashoutmoneyComponent', () => {
  let component: CashoutmoneyComponent;
  let fixture: ComponentFixture<CashoutmoneyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashoutmoneyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashoutmoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
