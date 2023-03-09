export class TBSType {
    text;
    values;
    baseType = "";
    constructor(text = "", values = []) {
        this.text = text;
        this.values = values;
        this.baseType = this.text.slice(0, this.text.indexOf("<") || this.text.indexOf("[") || this.text.length);
    }
}
