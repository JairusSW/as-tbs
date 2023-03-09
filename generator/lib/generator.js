import { TBSSchema } from "./schema.js";
import { TBSType } from "./type.js";
import { TBSMethod } from "./method.js";
import { TBSStatement } from "./statement.js";
import { getWidthOf } from "./util.js";
const numberTypes = ["i8", "u8", "i16", "u16", "i32", "u32", "f32", "i64", "I64", "u64", "f64"];
export class TBSGenerator {
    schemas = [];
    offset = 0;
    offsetDyn = [];
    constructor() { }
    parseSchema(schema) {
        let methods = [];
        if (schema.keys.length != schema.types.length)
            throw new Error("Could not add schema " + schema.name + " because it is missing a type or key");
        for (let pos = 0; pos < schema.keys.length; pos++) {
            const key = schema.keys[pos];
            const type = schema.types[pos];
            this.offset = 0;
            const method = new TBSMethod();
            if (numberTypes.includes(type.text.toLowerCase())) {
                this.offset += getWidthOf(type);
                method.serializeStmts.push(new TBSStatement(`store<${type.text}>(OFFSET, input.${key});`, this.offset));
                method.deserializeStmts.push(new TBSStatement(`out.${key} = load<${type.text}>(OFFSET);`, this.offset));
            }
            else if (type.text == "bool" || type.text == "boolean") {
                this.offset += getWidthOf(type);
                method.serializeStmts.push(new TBSStatement(`store<${type.text}>(OFFSET, input.${key});`, this.offset));
                method.deserializeStmts.push(new TBSStatement(`out.${key} = load<${type.text}>(OFFSET);`, this.offset));
            }
            else if (type.baseType == "StaticArray") {
                this.offset += 2;
                this.offsetDyn.push(`INPUT.${key}.length`);
                method.serializeStmts.push(new TBSStatement(`store<u16>(OFFSET, input.${key}.length);`, this.offset));
                method.serializeStmts.push(new TBSStatement(`memory.copy(OFFSET + 2, changetype<usize>(input.${key}), input.${key}.length);`, this.offset, this.offsetDyn));
                method.deserializeStmts.push(new TBSStatement(`memory.copy(changetype<usize>(out.${key}), OFFSET + 2, load<u16>(OFFSET));`, this.offset));
            }
            methods.push(method);
        }
        return methods;
    }
    generateSerializeMethod(schema, complex = true) {
        let baseOffset = 0;
        let stmts = [];
        for (const method of this.parseSchema(schema)) {
            for (const stmt of method.serializeStmts) {
                stmts.push((complex ? stmt.text.replaceAll("OFFSET", `changetype<usize>(out) + offset + <usize>${baseOffset}`) : stmt.text.replaceAll("OFFSET", `changetype<usize>(input) + <usize>${baseOffset}`)).replaceAll(" + <usize>0", ""));
                if (complex)
                    baseOffset += stmt.offset;
            }
        }
        return {
            statements: stmts,
            text: `@inline __TBS_Serialize(input: ${schema.name}, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n\t${stmts.join("\n\t")}\n}`
        };
    }
    generateDeserializeMethod(schema, complex = true) {
        let baseOffset = 0;
        let stmts = [];
        for (const method of this.parseSchema(schema)) {
            for (const stmt of method.deserializeStmts) {
                stmts.push((complex ? stmt.text.replaceAll("OFFSET", `changetype<usize>(input) + offset + <usize>${baseOffset}`) : stmt.text.replaceAll("OFFSET", `changetype<usize>(out) + <usize>${baseOffset}`)).replaceAll(" + <usize>0", ""));
                if (complex)
                    baseOffset += stmt.offset;
            }
        }
        return {
            statements: stmts,
            text: `@inline __TBS_Deserialize(input: ArrayBuffer, out: ${schema.name}, offset: usize = 0): ${schema.name} {\n\t${stmts.join("\n\t")}\n}`
        };
    }
}
const generator = new TBSGenerator();
const schema = new TBSSchema("Vec3", ["x", "y", "z"], [new TBSType("f32", []), new TBSType("f32", []), new TBSType("f32", [])]);
const serializeMethod = generator.generateSerializeMethod(schema);
console.log(serializeMethod.statements, serializeMethod.text);
const deserializeMethod = generator.generateDeserializeMethod(schema);
console.log(deserializeMethod.statements, deserializeMethod.text);
