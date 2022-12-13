import { ClassDecorator, registerDecorator, } from "visitor-as/dist/decorator.js";
import { getName, toString } from "visitor-as/dist/utils.js";
import { SimpleParser } from "visitor-as/dist/index.js";
class SchemaData {
    constructor() {
        this.keys = [];
        this.types = [];
        this.keyNames = [];
        this.name = "";
    }
}
class TBSTransform extends ClassDecorator {
    constructor() {
        super(...arguments);
        this.schemasList = [];
        this.sources = [];
    }
    visitMethodDeclaration() { }
    visitFieldDeclaration(node) {
        const lineText = toString(node);
        if (lineText.startsWith("private"))
            return;
        const name = getName(node);
        if (!node.type) {
            throw new Error(`Field ${name} is missing a type declaration`);
        }
        let type = getName(node.type);
        this.currentClass.keyNames.push(name);
        this.currentClass.types.push(type);
    }
    visitClassDeclaration(node) {
        if (!node.members) {
            return;
        }
        // This was triggering twice. I'm lazy
        // @ts-ignore
        if (node.covered)
            return;
        // @ts-ignore
        node.covered = true;
        this.currentClass = {
            name: toString(node.name),
            keys: [],
            keyNames: [],
            types: []
        };
        this.visit(node.members);
        for (let i = 0; i < this.currentClass.keyNames.length; i++) {
            const key = this.currentClass.keyNames[i];
            this.currentClass.keys.push([key, djb2Hash(key), this.currentClass.types[i]]);
        }
        this.currentClass.keys.sort((a, b) => a[1] - b[1]);
        let deserializeFunc = "__TBS_Deserialize(buffer: ArrayBuffer): void {\n";
        let serializeFunc = "__TBS_Serialize(): ArrayBuffer {\n\tconst buffer = changetype<ArrayBuffer>(__new(\n\t\t3,\n\t\tidof<ArrayBuffer>())\n\t);";
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];
            deserializeFunc += `\tthis.${key} = load<${type}>(changetype<usize>(buffer) + <usize>${typeToSize(type) * i});\n`;
            serializeFunc += `\tstore<${type}>(changetype<usize>(buffer) + <usize>${typeToSize(type) * i}, this.${key});\n`;
        }
        deserializeFunc += "}";
        serializeFunc = serializeFunc.slice(0, serializeFunc.length - 2);
        serializeFunc += "return buffer;\n}";
        const deserializeMethod = SimpleParser.parseClassMember(deserializeFunc, node);
        node.members.push(deserializeMethod);
        const serializeMethod = SimpleParser.parseClassMember(serializeFunc, node);
        node.members.push(serializeMethod);
        this.schemasList.push(this.currentClass);
        console.log(toString(node));
    }
    get name() {
        return "tbs";
    }
}
export default registerDecorator(new TBSTransform());
function djb2Hash(str) {
    const points = Array.from(str);
    let h = 5381;
    for (let p = 0; p < points.length; p++)
        // h = (h * 31 + c) | 0;
        h = ((h << 5) - h + points[p].codePointAt(0)) | 0;
    return h;
}
function typeToSize(data) {
    switch (data) {
        case "i32": {
            return 4;
        }
    }
    return 0;
}
