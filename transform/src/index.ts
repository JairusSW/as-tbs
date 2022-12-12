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

        for (const key of this.currentClass.keyNames) {
            this.currentClass.keys.push([key, djb2Hash(key)]);
        }

        this.currentClass.keys.sort((a, b) => a[1] - b[1]);
        
        let deserializeFunc = "__TBS_Deserialize(data: i32[]): void {\n"
        
        let serializeFunc = "__TBS_Serialize(): i32[] {\n\treturn [1, ";

        for (let i = 0; i < this.currentClass.keys.length; i++) {
            const key = this.currentClass.keys[i][0];
            deserializeFunc += `\tthis.${key} = unchecked(data[${i + 1}]);\n`;
            serializeFunc += `this.${key}, `
        }

        deserializeFunc += "}";
        serializeFunc = serializeFunc.slice(0, serializeFunc.length - 2);
        serializeFunc += "];\n}";

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