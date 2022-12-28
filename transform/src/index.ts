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
    public instantiates: Map<string, string> = new Map<string, string>();
    
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
        if (!node.decorators?.length) return;
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
            //if (member.name.text == "__TBS_ByteLength") return;
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
        let offsetDynamicSerialize: string = ""; 
        let offsetDynamicDeserialize: string = ""; 
        let instantiateStmts: string = "\n";
        let offset = 0;
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];
            const offsetText = offset == 0 ? "" : ` + <usize>${offset}`;
            switch (type) {
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
                    offset += 8
                        ;
                    break;
                }
                case "string8": {
                    offset++;
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(out)${offset == 1 ? "" : ` + <usize>${offset - 1}`}, input.${key}.length);\nmemory.copy(changetype<usize>(out)${offset == 0 ? "" : ` + <usize>${offset}`}${offsetDynamicSerialize}, changetype<usize>(String.UTF8.encode(input.${key})), <usize>input.${key}.length);`);
                    deserializeFunc.push(`\tout.${key} = String.UTF8.decodeUnsafe(changetype<usize>(input)${offset == 0 ? "" : ` + <usize>${offset}`}, load<u8>(changetype<usize>(input)${offset == -1 ? "" : ` + <usize>${offset-1}`}${offsetDynamicDeserialize}))`);
                    offsetDynamicSerialize += ` + <usize>input.${key}.length`;
                    offsetDynamicDeserialize += ` + <usize>out.${key}.length`;
                    break;
                }
                default: {
                    instantiateStmts += `result.${key} = changetype<${type}>(__new(offsetof<${type}>(), idof<${type}>())).__TBS_Instantiate();\n`;
                    serializeFunc.push(`\tinput.${key}.__TBS_Serialize(input.${key}, changetype<ArrayBuffer>(changetype<usize>(out)${offsetText}${offsetDynamicSerialize}))`);
                    deserializeFunc.push(`\tout.${key}.__TBS_Deserialize(changetype<ArrayBuffer>(changetype<usize>(input)${offsetText}${offsetDynamicDeserialize}), out.${key});`);
                    // TODO: Work with offset here
                }
            }
        }

        this.currentClass.offset = offset;

        for (const part of this.schemasList.filter(v => this.currentClass.types.includes(v.name))) {
            offset += part.offset;
        }

        const instantiateMethod = SimpleParser.parseClassMember(`@inline __TBS_Instantiate(): ${this.currentClass.name} {\n\tconst result = changetype<${this.currentClass.name}>(__new(offsetof<${this.currentClass.name}>(), idof<${this.currentClass.name}>()));${instantiateStmts}return result;\n}`, node);
        node.members.push(instantiateMethod);
        const byteLengthMethod = SimpleParser.parseClassMember(`@inline __TBS_ByteLength(): i32 {\n\treturn ${offset}${offsetDynamicSerialize.replaceAll("<usize>", "").replaceAll("input", "this")};\n}`, node);
        //console.log(toString(byteLengthMethod))

        node.members.push(byteLengthMethod);

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

//export default registerDecorator(new TBSTransform());
export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser: Parser): void {
        // Loop over every source
        for (const source of parser.sources) {
            // Ignore all lib (std lib). Visit everything else.
            if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
                new TBSTransform().visit(source);
            }
        }
    }
};