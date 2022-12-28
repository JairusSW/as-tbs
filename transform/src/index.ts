import {
    ClassDeclaration,
    FieldDeclaration,
    Source,
    Parser
} from "assemblyscript/dist/assemblyscript";
import { getName, toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";

const NullID: u8 = 0;
const TrueID: u8 = 1;
const FalseID: u8 = 2;
const String8ID: u8 = 3;
const String16ID: u8 = 4;
const ArrayID: u8 = 5;
const f32ID: u8 = 6;
const f64ID: u8 = 7;
const i32ID: u8 = 8;
const i64ID: u8 = 9;

class SchemaData {
    public keys: any[] = [];
    public types: string[] = [];
    public keyNames: string[] = [];
    public name: string = "";
    public offset: number = 0;
}

class TBSTransform extends BaseVisitor {
    public schemasList: SchemaData[] = [];
    public currentClass!: SchemaData;
    public sources: Source[] = [];
    
    visitMethodDeclaration(): void { }
    visitFieldDeclaration(node: FieldDeclaration): void {
        const lineText = toString(node);
        if (lineText.startsWith("private")) return;
        const name = getName(node);
        if (!node.type) {
            throw new Error(`Field ${name} is missing a type declaration`);
        }

        let type = getName(node.type);
        this.currentClass.keyNames.push(name);
        this.currentClass.types.push(type);
    }
    visitClassDeclaration(node: ClassDeclaration): void {
        let foundDecorator = false;
        for (const decorator of node.decorators!) {
            // @ts-ignore
            if (decorator.name.text.toLowerCase() == "tbs" || decorator.name.text.toLowerCase() == "serializable") foundDecorator = true;
        }
        if (!foundDecorator) return;

        if (!node.members) {
            return;
        }
        
        // Prevent from being triggered twice
        for (const member of node.members) {
            if (member.name.text == "__TBS_ByteLength") return;
        }

        this.currentClass = {
            name: toString(node.name),
            keys: [],
            keyNames: [],
            types: [],
            offset: 0,
        }

        this.visit(node.members);

        for (let i = 0; i < this.currentClass.keyNames.length; i++) {
            const key = this.currentClass.keyNames[i]!;
            this.currentClass.keys.push([key, djb2Hash(key), this.currentClass.types[i]]);
        }

        //this.currentClass.keys.sort((a, b) => a[1] - b[1]);

        let deserializeFunc: string[] = [];

        let serializeFunc: string[] = [];

        let offset = 0;
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];

            switch (type) {
                case "i8" || "u8": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`});`);
                    offset++;
                    break;
                }
                case "i16" || "u16": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`});`);
                    offset += 2;
                    break;
                }
                case "i32" || "u32": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`});`);
                    offset += 4;
                    break;
                }
                case "i64" || "u64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`});`);
                    offset += 8;
                    break;
                }
                case "f32": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`});`);
                    offset += 4;
                    break;
                }
                case "f64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`});`);
                    offset += 8
                        ;
                    break;
                }
                default: {
                    serializeFunc.push(`\tinput.${key}.__TBS_Serialize(input.${key}, changetype<ArrayBuffer>(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}))`);
                    deserializeFunc.push(`\tout.${key}.__TBS_Deserialize(changetype<ArrayBuffer>(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`}), out.${key});`);
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
        const deserializeMethod = SimpleParser.parseClassMember(
            `@inline __TBS_Deserialize(input: ArrayBuffer, out: ${this.currentClass.name}): void {\n${deserializeFunc.join("\n")}\n}`,
            node
        );

        node.members.push(deserializeMethod);

        const serializeMethod = SimpleParser.parseClassMember(
            `@inline __TBS_Serialize(input: ${this.currentClass.name}, out: ArrayBuffer): void {\n${serializeFunc.join("\n")}\n}`,
            node
        );

        node.members.push(serializeMethod);
        
        this.schemasList.push(this.currentClass);

        console.log(toString(node));
    }
    visitSource(node: Source): void {
        super.visitSource(node);
    }
}


function djb2Hash(str: string): number {
    const points = Array.from(str);
    let h = 5381;
    for (let p = 0; p < points.length; p++)
        // h = (h * 31 + c) | 0;
        h = ((h << 5) - h + points[p]!.codePointAt(0)!) | 0;
    return h;
}

function typeToSize(data: string): number {
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
    afterParse(parser: Parser): void {
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
};