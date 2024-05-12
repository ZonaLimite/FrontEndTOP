import { ApiFaults } from "./apiFaults";


export class QueryParam{
    constructor(
        public fechaIni: string,
        public fechaFin: string,
        public horaIni: string,
        public horaFin: string,        
        public turno: string,
        public programa: string,
        public maquina1: boolean,
        public maquina2: boolean,
        public apiFault: ApiFaults,
        public labelheader: string
    ){}
}