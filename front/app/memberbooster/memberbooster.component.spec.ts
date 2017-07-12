import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberboosterComponent } from './memberbooster.component';

describe('MemberboosterComponent', () => {
  let component: MemberboosterComponent;
  let fixture: ComponentFixture<MemberboosterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemberboosterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberboosterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
