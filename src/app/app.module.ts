import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

//Material
import {MatDialogModule} from "@angular/material/dialog";
import {MatInputModule} from "@angular/material/input";
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';

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
import { RemotengineComponent } from './components/remotengine/remotengine.component';
import { TrazastopComponent } from './pages/trazastop/trazastop.component';
import { ChatComponent } from './components/chat/chat.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DialogWithTemplateComponent } from './components/dialog-with-template/dialog-with-template.component';

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
    RemotengineComponent,
    TrazastopComponent,
    ChatComponent,
    DialogWithTemplateComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxChartsModule,
    MatDialogModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  providers: [ResultsetService, provideAnimationsAsync()],
  bootstrap: [AppComponent]
})
export class AppModule { }
