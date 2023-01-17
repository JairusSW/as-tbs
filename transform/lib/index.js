import { toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";
import { RangeTransform } from "visitor-as/dist/transformRange.js";
class SchemaData {
    keys = [];
    types = [];
    name = "";
    serializeStmts = [];
    deserializeStmts = [];
}
//let serializeText = "function __TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {\n";
class TBSTransform extends BaseVisitor {
    schemasList = [];
    currentClass;
    sources = [];
    // TODO: No globals, AAHHHH!
    // Make per-file and have TBS call the correct ser/de function
    serializeFunc = "@global function __TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {\n";
    deserializeFunc = "@global function __TBS_Deserialize<T>(input: ArrayBuffer, out: T): T {\n";
    globalStatements = [];
    visitMethodDeclaration() { }
    visitFieldDeclaration(node) {
        if (toString(node).startsWith("private"))
            return;
        if (!node.type)
            return;
        this.currentClass.keys.push(toString(node.name));
        this.currentClass.types.push(toString(node.type));
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
        const className = toString(node.name);
        this.currentClass = {
            name: className,
            keys: [],
            types: [],
            serializeStmts: [],
            deserializeStmts: []
        };
        this.visit(node.members);
        const keyHashes = this.currentClass.keys.map((v) => [v, djb2Hash(v)]).sort((a, b) => a[1] - b[1]);
        const sortedKeys = [];
        const sortedTypes = [];
        const sortedHashes = [];
        for (const [key, hash] of keyHashes) {
            sortedHashes.push(hash);
            sortedKeys.push(key);
            sortedTypes.push(this.currentClass.types.at(this.currentClass.keys.indexOf(key)));
        }
        this.currentClass.keys = sortedKeys;
        this.currentClass.types = sortedTypes;
        const serializeStmts = [];
        const deserializeStmts = [];
        let offset = 0;
        let offsetStruct = "";
        for (const key of this.currentClass.keys) {
            const baseType = this.currentClass.types.at(this.currentClass.keys.indexOf(key));
            const type = baseType.includes("<") ? baseType.slice(0, baseType.indexOf("<") || baseType.length) : baseType;
            const typeDeep = baseType.slice((baseType.indexOf("<") + 1) || 0, baseType.length - 1);
            console.log(typeDeep);
            switch (type) {
                case "i8" || "u8" || "i16" || "u16" || "i32" || "u32": {
                    serializeStmts.push(`store<${type}>(changetype<usize>(out) + <usize>${offset}, input.${key});`);
                    deserializeStmts.push(`out.${key} = load<${type}>(changetype<usize>(input) + <usize>${offset});`);
                    if (type.endsWith("8"))
                        offset++;
                    else if (type.endsWith("16"))
                        offset += 2;
                    else if (type.endsWith("32"))
                        offset += 4;
                    break;
                }
                case "StaticArray": {
                    //switch (typeDeep) {
                    //case "i8" || "u8" || "i16" || "u16" || "i32" || "u32": {
                    serializeStmts.push(`store<u16>(changetype<usize>(out) + <usize>${offset}, input.${key}.length);`);
                    serializeStmts.push(`memory.copy(changetype<usize>(out) + <usize>${offset + 2}, changetype<usize>(input.${key}), input.${key}.length);`);
                    deserializeStmts.push(`out.${key} = instantiate<${baseType}>(load<u8>(changetype<usize>(input) + <usize>${offset}));`);
                    deserializeStmts.push(`memory.copy(changetype<usize>(out.${key}), changetype<usize>(input) + <usize>${offset + 2}, load<u16>(changetype<usize>(input) + <usize>${offset}));`);
                    offset += 2;
                    // }
                    //}
                    break;
                }
            }
        }
        this.currentClass.serializeStmts = serializeStmts.map(v => v.replaceAll(" + <usize>0", ""));
        this.currentClass.deserializeStmts = deserializeStmts.map(v => v.replaceAll(" + <usize>0", ""));
        console.log(sortedKeys, sortedTypes, sortedHashes);
        console.log(this.currentClass.serializeStmts);
        console.log(this.currentClass.deserializeStmts);
        this.serializeFunc += `\tif (input instanceof ${className}) {\n`;
        for (const serStmt of this.currentClass.serializeStmts) {
            this.serializeFunc += "\t\t" + serStmt + "\n";
        }
        this.serializeFunc += "\t\treturn out;\n\t}\n\treturn unreachable();\n}";
        //console.log(this.serializeFunc);
        this.deserializeFunc += `\tif (out instanceof ${className}) {\n`;
        for (const derStmt of this.currentClass.deserializeStmts) {
            this.deserializeFunc += "\t\t" + derStmt + "\n";
        }
        this.deserializeFunc += "\t\treturn out;\n\t}\n\treturn unreachable();\n}";
        //console.log(this.deserializeFunc);
        this.globalStatements.push(SimpleParser.parseTopLevelStatement(this.serializeFunc));
        this.globalStatements.push(SimpleParser.parseTopLevelStatement(this.deserializeFunc));
    }
    visitSource(node) {
        this.globalStatements = [];
        super.visitSource(node);
        const replacer = new RangeTransform(node);
        for (const stmt of this.globalStatements) {
            console.log(toString(stmt));
            replacer.visit(stmt);
        }
        node.statements.unshift(...this.globalStatements);
    }
}
function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hash;
}
//export default registerDecorator(new TBSTransform());
export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser) {
        // Loop over every source
        for (const source of parser.sources) {
            // Ignore all lib (std lib). Visit everything else.
            if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
                const transform = new TBSTransform();
                transform.visit(source);
            }
        }
    }
}
;
