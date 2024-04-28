import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

//Graficas
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';

//services
import { ResultsetService } from './services/resultset.service';

//Modelos

//Componentes Layout
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { QuerierComponent } from './components/querier/querier.component';

//Componentes as Pages
import { HomeComponent } from './pages/home/home.component';
import { FallosComponent } from './pages/fallos/fallos.component';
import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';
import { TableviewerComponent } from './components/tableviewer/tableviewer.component';
import { GraficaComponent } from './components/grafica/grafica.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    HomeComponent,
    FallosComponent,
    EstadisticasComponent,
    TableviewerComponent,
    QuerierComponent,
    GraficaComponent,

    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxChartsModule
  ],
  providers: [ResultsetService],
  bootstrap: [AppComponent]
})
export class AppModule { }
