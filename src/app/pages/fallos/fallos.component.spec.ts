import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FallosComponent } from './fallos.component';

describe('FallosComponent', () => {
  let component: FallosComponent;
  let fixture: ComponentFixture<FallosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FallosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FallosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
