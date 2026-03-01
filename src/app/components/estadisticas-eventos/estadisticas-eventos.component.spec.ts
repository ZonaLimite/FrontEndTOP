import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticasEventosComponent } from './estadisticas-eventos.component';

describe('EstadisticasEventosComponent', () => {
  let component: EstadisticasEventosComponent;
  let fixture: ComponentFixture<EstadisticasEventosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EstadisticasEventosComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticasEventosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
