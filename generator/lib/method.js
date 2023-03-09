export class TBSMethod {
    name;
    serializeStmts;
    deserializeStmts;
    constructor(name = "", serializeStmts = [], deserializeStmts = []) {
        this.name = name;
        this.serializeStmts = serializeStmts;
        this.deserializeStmts = deserializeStmts;
    }
    generateStatements(type, baseOffset = 0) {
        let statements = [];
        if (type == "deserialize") {
            for (const stmt of this.deserializeStmts) {
                statements.push((baseOffset ? stmt.text.replace("OFFSET", `changetype<usize>(out) + offset + ${baseOffset}`) : stmt.text.replace("OFFSET", `changetype<usize>(out) + ${baseOffset}`)).replace(" + 0", ""));
                if (baseOffset)
                    baseOffset += stmt.offset;
            }
        }
        else if (type == "serialize") {
            for (const stmt of this.deserializeStmts) {
                statements.push((baseOffset ? stmt.text.replace("OFFSET", `changetype<usize>(input) + offset + ${baseOffset}`) : stmt.text.replace("OFFSET", `changetype<usize>(input) + ${baseOffset}`).replace(" + 0", "")).replace(" + 0", ""));
                if (baseOffset)
                    baseOffset += stmt.offset;
            }
        }
        return statements;
    }
}
