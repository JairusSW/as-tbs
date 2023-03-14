export class TBSStatement {
    text;
    offset;
    offsetDyn;
    constructor(text, offset, offsetDyn = []) {
        this.text = text;
        this.offset = offset;
        this.offsetDyn = offsetDyn;
    }
}
