import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogWithTemplateComponent } from '../components/dialog-with-template/dialog-with-template.component';
import { DialogWithTemplateData } from '../models/dialog-with-template-data.model.';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  //Inyectamos el servicio de material para manejar Dialogos
  constructor(private matDialog: MatDialog) { }

  //la firma de este metodo es el DialogoComponente a manejar y
  // unos datos de configuracion (que vienen como un arreglo)
  openDialogWithTemplate(data:DialogWithTemplateData){
    return this.matDialog.open(DialogWithTemplateComponent,{data})
  }

}
