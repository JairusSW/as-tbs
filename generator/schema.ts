import { TBSType } from "./type.js";
export class TBSSchema {
    constructor(public name: string = "", public keys: string[] = [], public types: TBSType[] = []) { }
}