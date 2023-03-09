export class TBSType {
    public baseType: string = "";
    constructor(public text: string = "", public values: TBSType[] = []) {
        this.baseType = this.text.slice(0, this.text.indexOf("<") || this.text.indexOf("[") || this.text.length);
    }
}