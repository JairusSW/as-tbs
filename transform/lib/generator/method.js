export class TBSMethod {
    name;
    serializeStmts;
    deserializeStmts;
    constructor(name = "", serializeStmts = [], deserializeStmts = []) {
        this.name = name;
        this.serializeStmts = serializeStmts;
        this.deserializeStmts = deserializeStmts;
    }
}
