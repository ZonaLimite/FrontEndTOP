export class ApiFaultsTable{
    constructor(
        public faultLabel:string,
        public faultApi:string,
        public modelColumn:string[]
    ){}
}