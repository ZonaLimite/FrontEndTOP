import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { FallosComponent } from './pages/fallos/fallos.component';
import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';
import { TrazastopComponent } from './pages/trazastop/trazastop.component';
import { DemoModulosComponent } from './pages/demo-modulos/demo-modulos.component';

const routes: Routes = [
  {path : 'home', component:HomeComponent},
  {path : 'fallos', component:FallosComponent},
  {path : 'traces', component:TrazastopComponent},
  {path : 'estadisticas', component:EstadisticasComponent},
  {path : 'demo-modulos', component:DemoModulosComponent},
  {path: '**', redirectTo:'home',pathMatch:'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
