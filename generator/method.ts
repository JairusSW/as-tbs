import { TBSStatement } from "./statement.js";

export class TBSMethod {
    constructor(public name: string = "", public serializeStmts: TBSStatement[] = [], public deserializeStmts: TBSStatement[] = []) { }
}