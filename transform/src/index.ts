import {
    ClassDeclaration,
    FieldDeclaration,
    Source,
    Parser,
    Statement
} from "assemblyscript/dist/assemblyscript";
import { toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";
import { RangeTransform } from "visitor-as/dist/transformRange.js";
class SchemaData {
    public keys: any[] = [];
    public types: string[] = [];
    public name: string = "";
    public serializeStmts: string[] = [];
    public deserializeStmts: string[] = [];
    public offset: number = 0;
}

//let serializeText = "function __TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {\n";
class TBSTransform extends BaseVisitor {
    public schemasList: SchemaData[] = [];
    public currentClass!: SchemaData;
    public sources: Source[] = [];

    // TODO: No globals, AAHHHH!
    // Make per-file and have TBS call the correct ser/de function
    public serializeFunc: string = "@global function __TBS_Serialize<T>(input: T, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n";
    public deserializeFunc: string = "@global function __TBS_Deserialize<T>(input: ArrayBuffer, out: T, offset: usize = 0): T {\n";

    public globalStatements: Statement[] = [];

    visitMethodDeclaration(): void { }
    visitFieldDeclaration(node: FieldDeclaration): void {
        if (toString(node).startsWith("private")) return;
        if (!node.type) return;
        this.currentClass.keys.push(toString(node.name));
        this.currentClass.types.push(toString(node.type));
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

        const className = toString(node.name);
        console.log("Visiting Class: " + className);
        this.currentClass = {
            name: className,
            keys: [],
            types: [],
            serializeStmts: [],
            deserializeStmts: [],
            offset: 0
        }

        this.visit(node.members);

        const keyHashes = this.currentClass.keys.map((v: string) => [v, djb2Hash(v)]).sort((a, b) => <number>a[1] - <number>b[1]);
        const sortedKeys: string[] = [];
        const sortedTypes: string[] = [];
        const sortedHashes: number[] = [];
        for (const [key, hash] of keyHashes) {
            sortedHashes.push(<number>hash);
            sortedKeys.push(<string>key);
            sortedTypes.push(this.currentClass.types.at(this.currentClass.keys.indexOf(key)));
        }

        this.currentClass.keys = sortedKeys;
        this.currentClass.types = sortedTypes;

        const serializeStmts: string[] = [];
        const deserializeStmts: string[] = [];
        let offset = 0;
        let offsetDyn = "";
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i]!;
            const baseType = sortedTypes[i]!;
            const type = baseType;
            console.log("type: " + type);
            if (["i8", "u8", "i16", "u16", "i32", "u32", "f32", "i64", "I64", "u64", "U64", "f64"].includes(type)) {
                serializeStmts.push(`store<${type}>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key});`);
                deserializeStmts.push(`out.${key} = load<${type}>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn});`);
                if (type.endsWith("8")) offset++;
                else if (type.endsWith("16")) offset += 2;
                else if (type.endsWith("32")) offset += 4;
                else if (type.endsWith("64")) offset += 8;
            } else if (["bool", "boolean"].includes(type)) {
                serializeStmts.push(`store<${type}>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key});`);
                deserializeStmts.push(`out.${key} = load<${type}>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn});`);
                offset++;
            } else if (type == "StaticArray") {
                //switch (typeDeep) {
                //case "i8" || "u8" || "i16" || "u16" || "i32" || "u32": {
                serializeStmts.push(`store<u16>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key}.length);`);
                serializeStmts.push(`memory.copy(changetype<usize>(out) + offset + <usize>${offset + 2}${offsetDyn}, changetype<usize>(input.${key}), input.${key}.length);`);
                deserializeStmts.push(`out.${key} = instantiate<${baseType}>(load<u8>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}));`)
                deserializeStmts.push(`memory.copy(changetype<usize>(out.${key}), changetype<usize>(input) + offset + <usize>${offset + 2}${offsetDyn}, load<u16>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}));`);
                offset += 2;
                offsetDyn += ` + <usize>dynamic.${key}.length`;
                //}
                //}
            } else if (type.startsWith("Array") && type != "ArrayBuffer") {

                serializeStmts.push(`store<u16>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key}.length);`);
                serializeStmts.push(`memory.copy(changetype<usize>(out) + offset + <usize>${offset + 2}${offsetDyn}, changetype<usize>(input.${key}.buffer), input.${key}.length);`);
                deserializeStmts.push(`out.${key} = instantiate<${baseType}>(load<u8>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}));`)
                deserializeStmts.push(`memory.copy(changetype<usize>(out.${key}.buffer), changetype<usize>(input) + offset + <usize>${offset + 2}${offsetDyn}, load<u16>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}));`);
                offset += 2;
                offsetDyn += ` + <usize>dynamic.${key}.length`;
                //}
                //}
            } else if (type == "string") {
                //switch (typeDeep) {
                //case "i8" || "u8" || "i16" || "u16" || "i32" || "u32": {
                serializeStmts.push(`store<u16>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key}.length);`);
                serializeStmts.push(`memory.copy(changetype<usize>(out) + offset + <usize>${offset + 2}${offsetDyn}, changetype<usize>(input.${key}), input.${key}.length << 1);`);
                deserializeStmts.push(`out.${key} = String.UTF16.decodeUnsafe(changetype<usize>(input) + offset + <usize>${offset + 2}${offsetDyn}, load<u16>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}) << 1);`);
                offset += 2;
                offsetDyn += ` + <usize>(dynamic.${key}.length << 1)`;
                //}
                //}
            } else if (this.schemasList.filter(v => v.name == type).length) {
                const ctx = this.schemasList.find(v => v.name == type);
                //console.log("Found A Class!", ctx);
                serializeStmts.push(`__TBS_Serialize(input.${key}, out, ${offset});`);
                deserializeStmts.push(`__TBS_Deserialize<${this.currentClass.types[this.currentClass.keys.indexOf(key)]}>(input, out.${key}, ${offset});`);
                offset += ctx!.offset;
            }
        }

        this.currentClass.serializeStmts = serializeStmts.map(v => v.replaceAll(" + <usize>0", "").replaceAll(" + <usize>dynamic.", " + <usize>input."));
        this.currentClass.deserializeStmts = deserializeStmts.map(v => v.replaceAll(" + <usize>0", "").replaceAll(" + <usize>dynamic.", " + <usize>out."));
        console.log(sortedKeys, sortedTypes, sortedHashes);

        this.currentClass.offset = offset;

        console.log(this.currentClass.serializeStmts);
        console.log(this.currentClass.deserializeStmts);

        if (this.serializeFunc != "@global function __TBS_Serialize<T>(input: T, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n") {
            this.serializeFunc += ` else if (input instanceof ${className}) {\n`;
            this.deserializeFunc += ` else if (out instanceof ${className}) {\n`;
        } else {
            this.serializeFunc += `\tif (input instanceof ${className}) {\n`;
            this.deserializeFunc += `\tif (out instanceof ${className}) {\n`;
        }

        for (const serStmt of this.currentClass.serializeStmts) {
            this.serializeFunc += "\t\t" + serStmt + "\n"
        }

        this.serializeFunc += "\t\treturn out;\n}";

        for (const derStmt of this.currentClass.deserializeStmts) {
            this.deserializeFunc += "\t\t" + derStmt + "\n"
        }
        this.deserializeFunc += "\t\treturn out;\n}";

        this.schemasList.push(this.currentClass);
    }
    visitSource(node: Source): void {
        this.globalStatements = [];
        super.visitSource(node);
        const replacer = new RangeTransform(node);
        for (const stmt of this.globalStatements) {
            console.log(toString(stmt));
            replacer.visit(stmt);
        }

        if (this.serializeFunc == "@global function __TBS_Serialize<T>(input: T, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n") return;
        this.serializeFunc += "\n\treturn unreachable();\n}";
        this.deserializeFunc += "\n\treturn unreachable();\n}";

        console.log(this.serializeFunc);
        console.log(this.deserializeFunc);

        const serFunc = SimpleParser.parseTopLevelStatement(this.serializeFunc);
        const deFunc = SimpleParser.parseTopLevelStatement(this.deserializeFunc);
        replacer.visit(serFunc);
        replacer.visit(deFunc);
        node.statements.unshift(serFunc);
        node.statements.unshift(deFunc);

        //node.statements.unshift(...this.globalStatements);
    }
}

function djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)!) & 0xFFFFFFFF;
    }
    return hash;
}

//export default registerDecorator(new TBSTransform());
export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser: Parser): void {
        // Loop over every source
        for (const source of parser.sources) {
            // Ignore all lib (std lib). Visit everything else.
            if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
                const transform = new TBSTransform();
                transform.visit(source);
            }
        }
    }
};