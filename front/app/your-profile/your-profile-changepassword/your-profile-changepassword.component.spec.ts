import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourProfileChangepasswordComponent } from './your-profile-changepassword.component';

describe('YourProfileChangepasswordComponent', () => {
  let component: YourProfileChangepasswordComponent;
  let fixture: ComponentFixture<YourProfileChangepasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourProfileChangepasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourProfileChangepasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
