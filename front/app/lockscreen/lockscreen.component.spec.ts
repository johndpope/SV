/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LockscreenComponent } from './lockscreen.component';

describe('LockscreenComponent', () => {
  let component: LockscreenComponent;
  let fixture: ComponentFixture<LockscreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LockscreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LockscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
