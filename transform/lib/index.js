import { getName, toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";
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
        this.instantiates = new Map();
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
        var _a, _b;
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
        let offsetDynamicSerialize = "";
        let offsetDynamicDeserialize = "";
        let instantiateStmts = "\n";
        let offset = 0;
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            let type = this.currentClass.keys[i][2];
            let offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
            /*let arrayType = "";
            if (type.toLowerCase().startsWith("array")) {
                arrayType = type.slice(type.indexOf("<"), type.length - 1);
                type = "array"
            } else if (type.toLowerCase().endsWith("[]")) {
                arrayType = type.slice(0, type.length - 2);
                type = "array"
            }*/
            console.log(type);
            switch (type) {
                case "Array<u8>": {
                    offset++;
                    offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetDynamicSerialize}, input.${key}.length);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key}.dataStart, input.${key}.length);`);
                    deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetDynamicDeserialize}));\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetDynamicDeserialize}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetDynamicDeserialize})));`);
                    offsetDynamicSerialize += ` + <usize>input.${key}.length`;
                    offsetDynamicDeserialize += ` + <usize>out.${key}.length`;
                    break;
                }
                case "boolean": {
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset++;
                    break;
                }
                case "i8" || "u8": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset++;
                    break;
                }
                case "i16" || "u16": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset += 2;
                    break;
                }
                case "i32" || "u32": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset += 4;
                    break;
                }
                case "i64" || "u64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset += 8;
                    break;
                }
                case "f32": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset += 4;
                    break;
                }
                case "f64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize});`);
                    offset += 8;
                    break;
                }
                case "string8": {
                    offset++;
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}, input.${key}.length);\nmemory.copy(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}${offsetDynamicSerialize}, changetype<usize>(String.UTF8.encode(input.${key})), <usize>input.${key}.length);`);
                    deserializeFunc.push(`\tout.${key} = String.UTF8.decodeUnsafe(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`}, load<u8>(changetype<usize>(input)${offset == -1 ? "" : ` + <usize>${offset - 1}`}${offsetDynamicDeserialize}))`);
                    offsetDynamicSerialize += ` + <usize>input.${key}.length`;
                    offsetDynamicDeserialize += ` + <usize>out.${key}.length`;
                    break;
                }
                default: {
                    instantiateStmts += `result.${key} = changetype<${type}>(__new(offsetof<${type}>(), idof<${type}>())).__TBS_Instantiate();\n`;
                    serializeFunc.push(`\tinput.${key}.__TBS_Serialize(input.${key}, changetype<ArrayBuffer>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}));`);
                    deserializeFunc.push(`\tout.${key}.__TBS_Deserialize(changetype<ArrayBuffer>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize}), out.${key});`);
                    // @ts-ignore
                    offset += (_b = this.schemasList.find(v => v.name == type)) === null || _b === void 0 ? void 0 : _b.keyNames.length;
                    break;
                }
            }
        }
        this.currentClass.offset = offset;
        /*for (const part of this.schemasList.filter(v => this.currentClass.types.includes(v.name))) {
            offset += part.offset;
        }*/
        const instantiateMethod = SimpleParser.parseClassMember(`@inline __TBS_Instantiate(): ${this.currentClass.name} {\n\tconst result = changetype<${this.currentClass.name}>(__new(offsetof<${this.currentClass.name}>(), idof<${this.currentClass.name}>()));${instantiateStmts}return result;\n}`, node);
        node.members.push(instantiateMethod);
        // @ts-ignore
        const byteLengthMethod = SimpleParser.parseClassMember(`@inline __TBS_ByteLength(): i32 {\n\treturn ${offset}${offsetDynamicSerialize.replaceAll("<usize>", "").replaceAll("input", "this")};\n}`, node);
        node.members.push(byteLengthMethod);
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
//export default registerDecorator(new TBSTransform());
export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser) {
        // Loop over every source
        for (const source of parser.sources) {
            // Ignore all lib (std lib). Visit everything else.
            if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
                new TBSTransform().visit(source);
            }
        }
    }
}
;
