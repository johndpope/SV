import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourProfileEditComponent } from './your-profile-edit.component';

describe('YourProfileEditComponent', () => {
  let component: YourProfileEditComponent;
  let fixture: ComponentFixture<YourProfileEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourProfileEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
