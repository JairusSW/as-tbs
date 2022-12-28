import { getName, toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";
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
        this.offset = 0;
    }
}
class TBSTransform extends BaseVisitor {
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
        var _a;
        let foundDecorator = false;
        if (!((_a = node.decorators) === null || _a === void 0 ? void 0 : _a.length))
            return;
        for (const decorator of node.decorators) {
            // @ts-ignore
            if (decorator.name.text.toLowerCase() == "tbs" || decorator.name.text.toLowerCase() == "serializable")
                foundDecorator = true;
        }
        if (!foundDecorator)
            return;
        if (!node.members) {
            return;
        }
        // Prevent from being triggered twice
        for (const member of node.members) {
            if (member.name.text == "__TBS_ByteLength")
                return;
        }
        this.currentClass = {
            name: toString(node.name),
            keys: [],
            keyNames: [],
            types: [],
            offset: 0,
        };
        this.visit(node.members);
        for (let i = 0; i < this.currentClass.keyNames.length; i++) {
            const key = this.currentClass.keyNames[i];
            this.currentClass.keys.push([key, djb2Hash(key), this.currentClass.types[i]]);
        }
        //this.currentClass.keys.sort((a, b) => a[1] - b[1]);
        let deserializeFunc = [];
        let serializeFunc = [];
        let offset = 0;
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];
            const offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
            switch (type) {
                case "i8" || "u8": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText});`);
                    offset++;
                    break;
                }
                case "i16" || "u16": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText});`);
                    offset += 2;
                    break;
                }
                case "i32" || "u32": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText});`);
                    offset += 4;
                    break;
                }
                case "i64" || "u64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText});`);
                    offset += 8;
                    break;
                }
                case "f32": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText});`);
                    offset += 4;
                    break;
                }
                case "f64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText});`);
                    offset += 8;
                    break;
                }
                case "string8": {
                    offset++;
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}, input.${key}.length);\nmemory.copy(changetype<usize>(out)${offsetText}, changetype<usize>(String.UTF8.encode(input.${key})), <usize>input.${key}.length);`);
                    deserializeFunc.push(`\tout.${key} = String.UTF8.decodeUnsafe(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}, load<u8>(changetype<usize>(out)${offsetText}))`);
                    break;
                }
                default: {
                    serializeFunc.push(`\tinput.${key}.__TBS_Serialize(input.${key}, changetype<ArrayBuffer>(changetype<usize>(out)${offsetText}))`);
                    deserializeFunc.push(`\tout.${key}.__TBS_Deserialize(changetype<ArrayBuffer>(changetype<usize>(input)${offsetText}), out.${key});`);
                    // TODO: Work with offset here
                }
            }
        }
        this.currentClass.offset = offset;
        for (const part of this.schemasList.filter(v => this.currentClass.types.includes(v.name))) {
            offset += part.offset;
        }
        const byteLengthProperty = SimpleParser.parseClassMember(`private __TBS_ByteLength: i32 = ${offset};`, node);
        node.members.push(byteLengthProperty);
        // console.log(`__TBS_Serialize(input: ${this.currentClass.name}, out: ArrayBuffer): void {\n${serializeFunc.join("\n")}\n}`)
        const deserializeMethod = SimpleParser.parseClassMember(`@inline __TBS_Deserialize(input: ArrayBuffer, out: ${this.currentClass.name}): void {\n${deserializeFunc.join("\n")}\n}`, node);
        node.members.push(deserializeMethod);
        const serializeMethod = SimpleParser.parseClassMember(`@inline __TBS_Serialize(input: ${this.currentClass.name}, out: ArrayBuffer): void {\n${serializeFunc.join("\n")}\n}`, node);
        node.members.push(serializeMethod);
        this.schemasList.push(this.currentClass);
        console.log(toString(node));
    }
    visitSource(node) {
        super.visitSource(node);
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
//export default registerDecorator(new TBSTransform());
export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser) {
        // Create new transform
        const transformer = new TBSTransform();
        // Loop over every source
        for (const source of parser.sources) {
            // Ignore all lib (std lib). Visit everything else.
            if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
                transformer.visit(source);
            }
        }
    }
}
;
