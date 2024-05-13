export class Mensaje {
    //Para el chat
    constructor(
      public texto: string,
      public fecha: number,
      public username: string,
      public tipo: string,
      public color: string){
    }
  }