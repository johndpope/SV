import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeboxComponent } from './safebox.component';

describe('SafeboxComponent', () => {
  let component: SafeboxComponent;
  let fixture: ComponentFixture<SafeboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SafeboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SafeboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
