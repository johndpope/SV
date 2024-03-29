import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YourProfileComponent } from './your-profile.component';

describe('YourProfileComponent', () => {
  let component: YourProfileComponent;
  let fixture: ComponentFixture<YourProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
