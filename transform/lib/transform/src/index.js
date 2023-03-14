import { isStdlib, toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";
import { TBSGenerator } from "../../generator/generator.js";
import { TBSSchema } from "../../generator/schema.js";
import { TBSType } from "../../generator/type.js";
class SchemaData {
    keys = [];
    types = [];
    name = "";
    serializeStmts = [];
    deserializeStmts = [];
    instantiateStmts = [];
    offset = 0;
}
//let serializeText = "__TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {\n";
class TBSTransform extends BaseVisitor {
    schemasList = [];
    currentClass;
    sources = [];
    // TODO: No globals, AAHHHH!
    // Make per-file and have TBS call the correct ser/de function
    serializeFunc = "";
    deserializeFunc = "";
    instantiateFunc = "";
    sizeFunc = "";
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
        this.serializeFunc = `@inline __TBS_Serialize(input: ${className}, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n`;
        this.deserializeFunc = `@inline __TBS_Deserialize(input: ArrayBuffer, out: ${className}, offset: usize = 0): ${className} {\n`;
        this.instantiateFunc = `@inline __TBS_Instantiate(): ${className} {\n`;
        this.sizeFunc = `@inline get __TBS_Size(): i32 {\n`;
        console.log("Visiting Class: " + className);
        this.currentClass = {
            name: className,
            keys: [],
            types: [],
            serializeStmts: [],
            deserializeStmts: [],
            instantiateStmts: [],
            offset: 0
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
        let offsetDyn = "";
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const baseType = sortedTypes[i];
            const type = baseType;
            console.log("type: " + type);
            if (["i8", "u8", "i16", "u16", "i32", "u32", "f32", "i64", "I64", "u64", "U64", "f64"].includes(type)) {
                serializeStmts.push(`store<${type}>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key});`);
                deserializeStmts.push(`out.${key} = load<${type}>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn});`);
                if (type.endsWith("8"))
                    offset++;
                else if (type.endsWith("16"))
                    offset += 2;
                else if (type.endsWith("32"))
                    offset += 4;
                else if (type.endsWith("64"))
                    offset += 8;
            }
            else if (["bool", "boolean"].includes(type)) {
                serializeStmts.push(`store<${type}>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key});`);
                deserializeStmts.push(`out.${key} = load<${type}>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn});`);
                offset++;
            }
            else if (type == "StaticArray") {
                serializeStmts.push(`store<u16>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key}.length);`);
                serializeStmts.push(`memory.copy(changetype<usize>(out) + offset + <usize>${offset + 2}${offsetDyn}, changetype<usize>(input.${key}), input.${key}.length);`);
                deserializeStmts.push(`memory.copy(changetype<usize>(out.${key}), changetype<usize>(input) + offset + <usize>${offset + 2}${offsetDyn}, load<u16>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}));`);
                offset += 2;
                offsetDyn += ` + <usize>dynamic.${key}.length`;
            }
            else if (type.startsWith("Array") && type != "ArrayBuffer") {
                console.log(type);
                serializeStmts.push(`store<u16>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key}.length);`);
                serializeStmts.push(`memory.copy(changetype<usize>(out) + offset + <usize>${offset + 2}${offsetDyn}, changetype<usize>(input.${key}.buffer), input.${key}.length);`);
                deserializeStmts.push(`out.${key}.buffer = input.slice(offset + <usize>${offset + 2}${offsetDyn}, offset + <usize>${offset + 2}${offsetDyn} + load<u16>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}));`);
                deserializeStmts.push(`store<usize>(changetype<usize>(out.${key}), changetype<usize>(out.${key}.buffer), offsetof<${type}>("dataStart"));`);
                deserializeStmts.push(`out.${key}.byteLength = out.${key}.buffer.byteLength;`);
                deserializeStmts.push(`out.${key}.length = out.${key}.buffer.byteLength;`);
                // TODO ^ This ONLY works for single byte arrays!!!
                offset += 2;
                offsetDyn += ` + <usize>dynamic.${key}.length`;
                this.currentClass.instantiateStmts.push(`this.${key} = [];`);
            }
            else if (type == "string") {
                serializeStmts.push(`store<u16>(changetype<usize>(out) + offset + <usize>${offset + offsetDyn}, input.${key}.length);`);
                serializeStmts.push(`memory.copy(changetype<usize>(out) + offset + <usize>${offset + 2}${offsetDyn}, changetype<usize>(input.${key}), input.${key}.length << 1);`);
                deserializeStmts.push(`out.${key} = String.UTF16.decodeUnsafe(changetype<usize>(input) + offset + <usize>${offset + 2}${offsetDyn}, load<u16>(changetype<usize>(input) + offset + <usize>${offset + offsetDyn}) << 1);`);
                offset += 2;
                offsetDyn += ` + <usize>(dynamic.${key}.length << 1)`;
                this.currentClass.instantiateStmts.push(`this.${key} = "";`);
            }
            else if (this.schemasList.filter(v => v.name == type).length) {
                const ctx = this.schemasList.find(v => v.name == type);
                //console.log("Found A Class!", ctx);
                serializeStmts.push(`input.${key}.__TBS_Serialize(input.${key}, out, ${offset});`);
                //deserializeStmts.push(`out.${key} = changetype<nonnull<${type}>>(__new(offsetof<nonnull<${type}>>(), idof<nonnull<${type}>>()));`);
                deserializeStmts.push(`out.${key}.__TBS_Deserialize(input, out.${key}, ${offset});`);
                offset += ctx.offset;
                this.currentClass.instantiateStmts.push(`this.${key} = new ${type}();`);
            }
        }
        this.currentClass.serializeStmts = serializeStmts.map(v => v.replaceAll(" + <usize>0", "").replaceAll(" + <usize>dynamic.", " + <usize>input."));
        this.currentClass.deserializeStmts = deserializeStmts.map(v => v.replaceAll(" + <usize>0", "").replaceAll(" + <usize>dynamic.", " + <usize>out."));
        console.log(sortedKeys, sortedTypes, sortedHashes);
        this.currentClass.offset = offset;
        console.log(this.currentClass.serializeStmts);
        console.log(this.currentClass.deserializeStmts);
        for (const serStmt of this.currentClass.serializeStmts) {
            this.serializeFunc += "\t\t" + serStmt + "\n";
        }
        this.serializeFunc += "\treturn out;\n}";
        for (const derStmt of this.currentClass.deserializeStmts) {
            this.deserializeFunc += "\t\t" + derStmt + "\n";
        }
        this.deserializeFunc += "\treturn out;\n}";
        for (const instStmt of this.currentClass.instantiateStmts) {
            this.instantiateFunc += "\t\t" + instStmt + "\n";
        }
        this.instantiateFunc += "\treturn this;\n}";
        this.sizeFunc += "\treturn " + this.currentClass.offset;
        if (offsetDyn.length)
            this.sizeFunc += offsetDyn.replaceAll("dynamic", "this").replaceAll("<usize>", "");
        this.sizeFunc += ";\n}";
        const serializeMethod = SimpleParser.parseClassMember(this.serializeFunc, node);
        const deserializeMethod = SimpleParser.parseClassMember(this.deserializeFunc, node);
        const instantiateMethod = SimpleParser.parseClassMember(this.instantiateFunc, node);
        const sizeMethod = SimpleParser.parseClassMember(this.sizeFunc, node);
        if (!node.members.find(v => v.name.text == "__TBS_Serialize")) {
            node.members.push(serializeMethod);
            console.log(this.serializeFunc);
        }
        if (!node.members.find(v => v.name.text == "__TBS_Deserialize")) {
            node.members.push(deserializeMethod);
            console.log(this.deserializeFunc);
        }
        if (!node.members.find(v => v.name.text == "__TBS_Instantiate")) {
            node.members.push(instantiateMethod);
            console.log(this.instantiateFunc);
        }
        if (!node.members.find(v => v.name.text == "__TBS_Size")) {
            node.members.push(sizeMethod);
            console.log(this.sizeFunc);
        }
        const generator = new TBSGenerator();
        const schema = new TBSSchema(this.currentClass.name, this.currentClass.keys, this.currentClass.types.map(t => new TBSType(t)));
        const serializeMethods = generator.generateSerializeMethods(schema);
        if (!node.members.find(v => v.name.text == "__TBS_Serialize_Key")) {
            node.members.push(SimpleParser.parseClassMember(serializeMethods.keyText, node));
            console.log(serializeMethods.keyText);
        }
        const deserializeMethods = generator.generateSerializeMethods(schema);
        if (!node.members.find(v => v.name.text == "__TBS_Deserialize_Key")) {
            node.members.push(SimpleParser.parseClassMember(deserializeMethods.keyText, node));
            console.log(deserializeMethods.keyText);
        }
        this.schemasList.push(this.currentClass);
    }
    visitSource(node) {
        this.globalStatements = [];
        super.visitSource(node);
    }
}
function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hash;
}
export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser) {
        // Create new transform
        const transformer = new TBSTransform();
        // Sort the sources so that user scripts are visited last
        const sources = parser.sources.filter(source => !isStdlib(source)).sort((_a, _b) => {
            const a = _a.internalPath;
            const b = _b.internalPath;
            if (a[0] === "~" && b[0] !== "~") {
                return -1;
            }
            else if (a[0] !== "~" && b[0] === "~") {
                return 1;
            }
            else {
                return 0;
            }
        });
        // Loop over every source
        for (const source of sources) {
            // Ignore all lib and std. Visit everything else.
            if (!isStdlib(source)) {
                transformer.visit(source);
            }
        }
    }
}
;
