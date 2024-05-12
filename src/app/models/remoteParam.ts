export class RemoteParam{
    constructor(
        public maquina: string,
        public sistema: string,
        public modulo: string,
        public listener: string,   
        public textListener: string,
        public active: boolean    
    ){}
}