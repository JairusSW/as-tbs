import { getName, toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";
class SchemaData {
    keys = [];
    types = [];
    keyNames = [];
    name = "";
    offset = 0;
    offsetAdd = "";
}
class TBSTransform extends BaseVisitor {
    schemasList = [];
    currentClass;
    sources = [];
    instantiates = new Map();
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
        let foundDecorator = false;
        if (!node.decorators?.length)
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
            offsetAdd: ""
        };
        this.visit(node.members);
        for (let i = 0; i < this.currentClass.keyNames.length; i++) {
            const key = this.currentClass.keyNames[i];
            this.currentClass.keys.push([key, djb2Hash(key), this.currentClass.types[i]]);
        }
        //this.currentClass.keys.sort((a, b) => a[1] - b[1]);
        let deserializeFunc = [];
        let serializeFunc = [];
        let offsetAdd = "";
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
            console.log("type: " + type);
            if (type == "Array<u8>" || type == "u8[]" || type == "Array<i8>" || type == "i8[]") {
                offset++;
                offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd}, input.${key}.length);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key}.dataStart, input.${key}.length);`);
                deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}));\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")})));`);
                offsetAdd += ` + <usize>input.${key}.length`;
            }
            else if (type == "Array<u16>" || type == "u16[]" || type == "Array<i16>" || type == "i16[]") {
                offset++;
                offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd}, input.${key}.length << 1);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key}.dataStart, input.${key}.length << 1);`);
                deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}) >> 1);\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")})));`);
                offsetAdd += ` + <usize>(input.${key}.length << 1)`;
            }
            else if (type == "Array<u32>" || type == "u32[]" || type == "Array<i32>" || type == "i32[]") {
                offset++;
                offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd}, input.${key}.length << 2);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key}.dataStart, input.${key}.length << 2);`);
                deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}) >> 2);\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")})));`);
                offsetAdd += ` + <usize>(input.${key}.length << 2)`;
            }
            else if (type == "Array<u64>" || type == "u64[]" || type == "Array<i64>" || type == "i64[]") {
                offset++;
                offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd}, input.${key}.length << 3);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key}.dataStart, input.${key}.length << 3);`);
                deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}) >> 3);\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")})));`);
                offsetAdd += ` + <usize>(input.${key}.length << 3)`;
            }
            else if (type == "Array<f32>" || type == "f32[]" || type == "Array<f32>" || type == "f32[]") {
                offset++;
                offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd}, input.${key}.length << 2);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key}.dataStart, input.${key}.length << 2);`);
                deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}) >> 2);\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")})));`);
                offsetAdd += ` + <usize>(input.${key}.length << 2)`;
            }
            else if (type == "Array<f64" || type == "f64[]" || type == "Array<f64>" || type == "f64[]") {
                offset++;
                offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd}, input.${key}.length << 3);\nmemory.copy(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key}.dataStart, input.${key}.length << 3);`);
                deserializeFunc.push(`\tout.${key} = instantiate<${type}>(load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}) >> 3);\n\tmemory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}, load<u8>(changetype<usize>(input)${offset == 1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")})));`);
                offsetAdd += ` + <usize>(input.${key}.length << 3)`;
            }
            else if (type == "boolean") {
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset++;
            }
            else if (["i8", "u8", "I8", "U8"].includes(type)) {
                serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset++;
            }
            else if (["i16", "u16", "I16", "U16"].includes(type)) {
                serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset += 2;
            }
            else if (["i32", "u32", "I32", "U32"].includes(type)) {
                serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset += 4;
            }
            else if (["i64", "u64", "I64", "U64"].includes(type)) {
                console.log("FOUND U64");
                serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset += 8;
            }
            else if (type == "f32" || type == "F32") {
                serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset += 4;
            }
            else if (type == "f64" || type == "F64") {
                serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offsetText}${offsetAdd}, input.${key});`);
                deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")});`);
                offset += 8;
            }
            else if (type == "string8") {
                offset++;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}, input.${key}.length);\nmemory.copy(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}${offsetAdd}, changetype<usize>(String.UTF8.encode(input.${key})), <usize>input.${key}.length);`);
                deserializeFunc.push(`\tout.${key} = String.UTF8.decodeUnsafe(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`}, load<u8>(changetype<usize>(input)${offset == -1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}))`);
                offsetAdd += ` + <usize>input.${key}.length`;
            }
            else if (type == "string") {
                offset++;
                serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}, input.${key}.length << 1);\nmemory.copy(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}${offsetAdd}, changetype<usize>(String.UTF16.encode(input.${key})), <usize>input.${key}.length << 1);`);
                deserializeFunc.push(`\tout.${key} = String.UTF16.decodeUnsafe(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`}, load<u8>(changetype<usize>(input)${offset == -1 ? "" : ` + <usize>${offset - 1}`}${offsetAdd.replaceAll("input", "out")}))`);
                offsetAdd += ` + <usize>(input.${key}.length << 1)`;
            }
            else {
                instantiateStmts += `result.${key} = changetype<${type}>(__new(offsetof<${type}>(), idof<${type}>())).__TBS_Instantiate();\n`;
                serializeFunc.push(`\tinput.${key}.__TBS_Serialize(input.${key}, changetype<ArrayBuffer>(changetype<usize>(out)${offsetText}${offsetAdd}));`);
                deserializeFunc.push(`\tout.${key}.__TBS_Deserialize(changetype<ArrayBuffer>(changetype<usize>(input)${offsetText}${offsetAdd.replaceAll("input", "out")}), out.${key});`);
                // @ts-ignore
                console.log(`Offset: ${offset}`);
                offset += (this.schemasList.find(v => v.name == type)?.offset || 0);
                offsetAdd += this.schemasList.find(v => v.name == type)?.offsetAdd?.replaceAll("input", `this.${key}`);
                // @ts-ignore
                //offsetAdd += this.schemasList.find(v => v.name == type)?.offsetAdd;
            }
        }
        this.currentClass.offset = offset;
        this.currentClass.offsetAdd = offsetAdd;
        /*for (const part of this.schemasList.filter(v => this.currentClass.types.includes(v.name))) {
            offset += part.offset;
        }*/
        const instantiateMethod = SimpleParser.parseClassMember(`@inline __TBS_Instantiate(): ${this.currentClass.name} {\n\tconst result = changetype<${this.currentClass.name}>(__new(offsetof<${this.currentClass.name}>(), idof<${this.currentClass.name}>()));${instantiateStmts}return result;\n}`, node);
        node.members.push(instantiateMethod);
        console.log(`Offset: ${offset}`);
        // @ts-ignore
        const byteLengthMethod = SimpleParser.parseClassMember(`@inline __TBS_ByteLength(): i32 {\n\treturn ${offset}${offsetAdd.replaceAll("<usize>", "").replaceAll("input", "this")};\n}`, node);
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
        h = ((h << 5) - h + points[p].codePointAt(80));
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
