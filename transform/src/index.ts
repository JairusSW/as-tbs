import {
    ClassDeclaration,
    FieldDeclaration,
    Source,
} from "assemblyscript/dist/assemblyscript";
import {
    ClassDecorator,
    registerDecorator,
} from "visitor-as/dist/decorator.js";
import { getName, toString } from "visitor-as/dist/utils.js";
import { SimpleParser } from "visitor-as/dist/index.js";

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
}

class TBSTransform extends ClassDecorator {
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
        console.log(`Visiting ${node.name.text}`)
        if (!node.members) {
            return;
        }
        // Prevent from being triggered twice
        for (const member of node.members) {
            console.log(member.name.text)
            if (member.name.text == "__TBS_ByteLength") return;
        }
        // This was triggering twice. I'm lazy
        // @ts-ignore
        //if (node.covered) return;
        // @ts-ignore
        //node.covered = true;

        this.currentClass = {
            name: toString(node.name),
            keys: [],
            keyNames: [],
            types: []
        }

        this.visit(node.members);

        for (let i = 0; i < this.currentClass.keyNames.length; i++) {
            const key = this.currentClass.keyNames[i]!;
            this.currentClass.keys.push([key, djb2Hash(key), this.currentClass.types[i]]);
        }

        this.currentClass.keys.sort((a, b) => a[1] - b[1]);

        let byteLength = 0;

        for (let i = 0; i < this.currentClass.types.length; i++) {
            const type = this.currentClass.types[i];
            byteLength += typeToSize(type!);
        }

        let deserializeFunc: string[] = [];

        let serializeFunc: string[] = [];

        const addLengths: string[] = [];

        let offset = -typeToSize(this.currentClass.keys[0][2]);
        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];

            if (type == "string") {
                addLengths.push(` + (this.${key}.length << 1)`);
            } if (type == "string8") {
                addLengths.push(` + this.${key}.length`);
            }

            offset += typeToSize(type)

            switch (type) {
                case "i8" || "i16" || "i32" || "i64" || "u8" || "u16" || "u32" || "u64" || "f32" || "f64": {
                    serializeFunc.push(`\tstore<${type}>(changetype<usize>(out) + <usize>${offset}, input.${key});`);
                    deserializeFunc.push(`\tout.${key} = load<${type}>(changetype<usize>(input) + <usize>${offset});`);
                    break;
                }
                case "string8": {
                    serializeFunc.push(`\tstore<u32>(changetype<usize>(out) + <usize>${offset - 3}, input.${key}.length);
        memory.copy(changetype<usize>(out) + <usize>${++offset}, changetype<usize>(String.UTF8.encode(input.${key})), <usize>input.${key}.length);`);
                    deserializeFunc.push(`\tout.${key} = String.UTF8.decodeUnsafe(changetype<usize>(input) + <usize>${offset}, load<u8>(changetype<usize>(input) + <usize>${offset - 4}))`);
                    break;
                }
                case "string": {
                    serializeFunc.push(`\tstore<u32>(changetype<usize>(out) + <usize>${offset - 3}, input.${key}.length << 1);
        memory.copy(changetype<usize>(out) + <usize>${++offset}, changetype<usize>(String.UTF16.encode(input.${key})), <usize>input.${key}.length << 1);`);
                    deserializeFunc.push(`\tout.${key} = String.UTF16.decodeUnsafe(changetype<usize>(input) + <usize>${offset}, load<u8>(changetype<usize>(input) + <usize>${offset - 4}))`);
                    break;
                }
                case "boolean" || "bool": {
                    serializeFunc.push(`\tstore<u8>(changetype<usize>(out) + <usize>${offset}, input.${key} ? 1 : 2);\n`);
                    deserializeFunc.push(`\tout.${key} = load<u8>(changetype<usize>(input) + <usize>${offset}) == 1 ? true : false;\n`)
                }
            }
        }

        const byteLengthProperty = SimpleParser.parseClassMember(`public __TBS_ByteLength: u8 = 3;`, node);

        node.members.push(byteLengthProperty);

       // console.log(`__TBS_Serialize(input: ${this.currentClass.name}, out: ArrayBuffer): void {\n${serializeFunc.join("\n")}\n}`)
        const deserializeMethod = SimpleParser.parseClassMember(
            `static __TBS_Deserialize(input: ArrayBuffer, out: ${this.currentClass.name}): void {\n${deserializeFunc.join("\n")}\n}`,
            node
        );

        node.members.push(deserializeMethod);

        const serializeMethod = SimpleParser.parseClassMember(
            `static __TBS_Serialize(input: ${this.currentClass.name}, out: ArrayBuffer): void {\n${serializeFunc.join("\n")}\n}`,
            node
        );

        node.members.push(serializeMethod);

        this.schemasList.push(this.currentClass);

        console.log(toString(node));
    }
    get name(): string {
        return "tbs";
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

export default registerDecorator(new TBSTransform());