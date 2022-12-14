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
        if (!node.members) {
            return;
        }

        // This was triggering twice. I'm lazy
        // @ts-ignore
        if (node.covered) return;
        // @ts-ignore
        node.covered = true;

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

        let deserializeFunc = "__TBS_Deserialize(buffer: ArrayBuffer): void {\n"
        
        let serializeFunc = `__TBS_Serialize(): ArrayBuffer {\n\tconst buffer = changetype<ArrayBuffer>(__new(\n\t\t${byteLength},\n\t\tidof<ArrayBuffer>())\n\t);`;

        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            const type = this.currentClass.keys[i][2];
            deserializeFunc += `\tthis.${key} = load<${type}>(changetype<usize>(buffer) + <usize>${typeToSize(type) * i});\n`;
            serializeFunc += `\tstore<${type}>(changetype<usize>(buffer) + <usize>${typeToSize(type) * i}, this.${key});\n`
        }

        deserializeFunc += "}";
        serializeFunc = serializeFunc.slice(0, serializeFunc.length - 2);
        serializeFunc += "return buffer;\n}"

        const deserializeMethod = SimpleParser.parseClassMember(
            deserializeFunc,
            node
        );
        
        node.members.push(deserializeMethod);

        const serializeMethod = SimpleParser.parseClassMember(
            serializeFunc,
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

export default registerDecorator(new TBSTransform());

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
    }
    return 0;
}