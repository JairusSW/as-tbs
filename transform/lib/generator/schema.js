export class TBSSchema {
    name;
    keys;
    types;
    constructor(name = "", keys = [], types = []) {
        this.name = name;
        this.keys = keys;
        this.types = types;
        // TODO: Sort with djb2
    }
}
