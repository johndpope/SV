import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommisioninjectionComponent } from './commisioninjection.component';

describe('CommisioninjectionComponent', () => {
  let component: CommisioninjectionComponent;
  let fixture: ComponentFixture<CommisioninjectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommisioninjectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommisioninjectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
