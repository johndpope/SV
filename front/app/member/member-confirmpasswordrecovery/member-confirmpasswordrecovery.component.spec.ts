import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberConfirmpasswordrecoveryComponent } from './member-confirmpasswordrecovery.component';

describe('MemberConfirmpasswordrecoveryComponent', () => {
  let component: MemberConfirmpasswordrecoveryComponent;
  let fixture: ComponentFixture<MemberConfirmpasswordrecoveryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemberConfirmpasswordrecoveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberConfirmpasswordrecoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
