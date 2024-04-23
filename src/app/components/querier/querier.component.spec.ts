import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuerierComponent } from './querier.component';

describe('QuerierComponent', () => {
  let component: QuerierComponent;
  let fixture: ComponentFixture<QuerierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuerierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuerierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
