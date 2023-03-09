import { TBSStatement } from "./statement.js";

export class TBSMethod {
    constructor(public name: string = "", public serializeStmts: TBSStatement[] = [], public deserializeStmts: TBSStatement[] = []) { }
    generateStatements(type: "deserialize" | "serialize", baseOffset: number = 0): string[] {
        let statements: string[] = [];
        if (type == "deserialize") {
            for (const stmt of this.deserializeStmts) {
                statements.push((baseOffset ? stmt.text.replace("OFFSET", `changetype<usize>(out) + offset + ${baseOffset}`) : stmt.text.replace("OFFSET", `changetype<usize>(out) + ${baseOffset}`)).replace(" + 0", ""));
                if (baseOffset) baseOffset += stmt.offset;
            }
        } else if (type == "serialize") {
            for (const stmt of this.deserializeStmts) {
                statements.push((baseOffset ? stmt.text.replace("OFFSET", `changetype<usize>(input) + offset + ${baseOffset}`) : stmt.text.replace("OFFSET", `changetype<usize>(input) + ${baseOffset}`).replace(" + 0", "")).replace(" + 0", ""));
                if (baseOffset) baseOffset += stmt.offset;
            }
        }
        return statements;
    }
}