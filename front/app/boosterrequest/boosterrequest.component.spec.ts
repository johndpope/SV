import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoosterrequestComponent } from './boosterrequest.component';

describe('BoosterrequestComponent', () => {
  let component: BoosterrequestComponent;
  let fixture: ComponentFixture<BoosterrequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoosterrequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoosterrequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
