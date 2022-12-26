import { ClassDecorator, registerDecorator, } from "visitor-as/dist/decorator.js";
import { getName, toString } from "visitor-as/dist/utils.js";
import { SimpleParser } from "visitor-as/dist/index.js";
const NullID = 0;
const TrueID = 1;
const FalseID = 2;
const String8ID = 3;
const String16ID = 4;
const ArrayID = 5;
const f32ID = 6;
const f64ID = 7;
const i32ID = 8;
const i64ID = 9;
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
        let byteLength = 0;
        for (let i = 0; i < this.currentClass.types.length; i++) {
            const type = this.currentClass.types[i];
            byteLength += typeToSize(type);
        }
        let deserializeFunc = [];
        let serializeFunc = [];
        const addLengths = [];
        let offset = -typeToSize(this.currentClass.keys[0][2]);
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];
            if (type == "string") {
                addLengths.push(` + (this.${key}.length << 1)`);
            }
            if (type == "string8") {
                addLengths.push(` + this.${key}.length`);
            }
            offset += typeToSize(type);
            switch (type) {
                case "i8" || "i16" || "i32" || "i64" || "u8" || "u16" || "u32" || "u64" || "f32" || "f64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(buffer) + <usize>${offset}, this.${key});`);
                    deserializeFunc.push(`\tthis.${key} = load<${type}>(changetype<usize>(buffer) + <usize>${offset});`);
                    break;
                }
                case "string8": {
                    serializeFunc.push(`\tstore<u32>(changetype<usize>(buffer) + <usize>${offset - 3}, this.${key}.length);
        memory.copy(changetype<usize>(buffer) + <usize>${++offset}, changetype<usize>(String.UTF8.encode(this.${key})), <usize>this.${key}.length);`);
                    deserializeFunc.push(`\tthis.${key} = String.UTF8.decodeUnsafe(changetype<usize>(buffer) + <usize>${offset}, load<u8>(changetype<usize>(buffer) + <usize>${offset - 4}))`);
                    break;
                }
                case "string": {
                    serializeFunc.push(`\tstore<u32>(changetype<usize>(buffer) + <usize>${offset - 3}, this.${key}.length << 1);
        memory.copy(changetype<usize>(buffer) + <usize>${++offset}, changetype<usize>(String.UTF16.encode(this.${key})), <usize>this.${key}.length << 1);`);
                    deserializeFunc.push(`\tthis.${key} = String.UTF16.decodeUnsafe(changetype<usize>(buffer) + <usize>${offset}, load<u8>(changetype<usize>(buffer) + <usize>${offset - 4}))`);
                    break;
                }
                case "boolean" || "bool": {
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(buffer) + <usize>${offset}, this.${key} ? 1 : 2);\n`);
                    deserializeFunc.push(`\tthis.${key} = load<u8>(changetype<usize>(buffer) + <usize>${offset}) == 1 ? true : false;\n`);
                }
            }
        }
        const deserializeMethod = SimpleParser.parseClassMember("__TBS_Deserialize(buffer: ArrayBuffer): void {\n" + deserializeFunc.join("\n") + "\n}", node);
        node.members.push(deserializeMethod);
        const serializeMethod = SimpleParser.parseClassMember(`__TBS_Serialize(): ArrayBuffer {\n\tconst buffer = changetype<ArrayBuffer>(__new(${byteLength}${addLengths.join("")},idof<ArrayBuffer>()));\n` + serializeFunc.join("\n") + "return buffer;\n}", node);
        node.members.push(serializeMethod);
        this.schemasList.push(this.currentClass);
        console.log(toString(node));
    }
    get name() {
        return "tbs";
    }
}
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
        case "i8": {
            return 1;
        }
        case "i16": {
            return 2;
        }
        case "i32": {
            return 4;
        }
        case "i64": {
            return 8;
        }
        case "u8": {
            return 1;
        }
        case "u16": {
            return 2;
        }
        case "u32": {
            return 4;
        }
        case "u64": {
            return 8;
        }
        case "string8": {
            return 4;
        }
        case "string": {
            return 4;
        }
        case "boolean" || "bool": {
            return 1;
        }
    }
    return 0;
}
export default registerDecorator(new TBSTransform());
