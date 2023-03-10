import { TBSSchema } from "./schema.js";
import { TBSType } from "./type.js";
import { TBSMethod } from "./method.js";
import { TBSStatement } from "./statement.js";
import { getWidthOf } from "./util.js";
import { hash32, hashStr, stringToUint8Array } from "./hash.js";

const numberTypes = ["i8", "u8", "i16", "u16", "i32", "u32", "f32", "i64", "I64", "u64", "f64"];

export class TBSGenerator {
    public schemas: TBSSchema[] = [];
    public offset: number = 0;
    public offsetDyn: string[] = [];
    constructor() { }
    parseSchema(schema: TBSSchema): TBSMethod[] {
        let methods: TBSMethod[] = [];
        if (schema.keys.length != schema.types.length) throw new Error("Could not add schema " + schema.name + " because it is missing a type or key");
        for (let pos = 0; pos < schema.keys.length; pos++) {
            const key = schema.keys[pos];
            const type = schema.types[pos];
            this.offset = 0;
            const method = new TBSMethod();
            if (numberTypes.includes(type.text.toLowerCase())) {
                this.offset += getWidthOf(type);
                method.serializeStmts.push(new TBSStatement(
                    `store<${type.text}>(OFFSET, input.${key});`,
                    this.offset
                ));
                method.deserializeStmts.push(new TBSStatement(
                    `out.${key} = load<${type.text}>(OFFSET);`,
                    this.offset
                ));
            } else if (type.text == "bool" || type.text == "boolean") {
                this.offset += getWidthOf(type);
                method.serializeStmts.push(new TBSStatement(
                    `store<${type.text}>(OFFSET, input.${key});`,
                    this.offset
                ));
                method.deserializeStmts.push(new TBSStatement(
                    `out.${key} = load<${type.text}>(OFFSET);`,
                    this.offset
                ));
            } else if (type.baseType == "StaticArray") {
                this.offset += 2;
                this.offsetDyn.push(`INPUT.${key}.length`);
                method.serializeStmts.push(new TBSStatement(`store<u16>(OFFSET, input.${key}.length);`,
                    this.offset
                ));
                method.serializeStmts.push(new TBSStatement(
                    `memory.copy(OFFSET + 2, changetype<usize>(input.${key}), input.${key}.length);`,
                    this.offset,
                    this.offsetDyn
                ));

                method.deserializeStmts.push(new TBSStatement(
                    `memory.copy(changetype<usize>(out.${key}), OFFSET + 2, load<u16>(OFFSET));`,
                    this.offset
                ));
            } else if (type.baseType == "string") {
                
            }
            methods.push(method);
        }
        return methods;
    }
    generateSerializeMethods(schema: TBSSchema) {
        let baseOffset = 0;
        let fluidOffset = 0;
        let keyStmts: string[] = [];
        let methodStmts: string[] = [];
        for (const method of this.parseSchema(schema)) {
            baseOffset = 0;
            for (const stmt of method.serializeStmts) {
                methodStmts.push(stmt.text.replaceAll("OFFSET", `changetype<usize>(out) + offset + <usize>${fluidOffset}`).replaceAll(" + <usize>0", ""));
                keyStmts.push(stmt.text.replaceAll("OFFSET", `changetype<usize>(out) + offset + <usize>${baseOffset}`).replaceAll(" + <usize>0", ""));
                baseOffset += stmt.offset;
                fluidOffset += stmt.offset;
            }
        }
        let id = 0;
        return {
            keyStmts: keyStmts,
            methodStmts: methodStmts,
            methodText: `@inline __TBS_Serialize(input: ${schema.name}, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n    ${methodStmts.join("\n    ")}\n}`,
            keyText: `@inline __TBS_Serialize_Key(key: i32, input: ${schema.name}, out: ArrayBuffer, offset: usize = 0): ${schema.name} {\n    ` + "switch (key) {\n        " + keyStmts.map(v => `    case ${id++}: {\n            ${v}\n            break;\n        }`).join("\n    "),
        }
    }
    generateDeserializeMethods(schema: TBSSchema) {
        let baseOffset = 0;
        let fluidOffset = 0;
        let keyStmts: string[] = [];
        let methodStmts: string[] = [];
        for (const method of this.parseSchema(schema)) {
            baseOffset = 0;
            for (const stmt of method.deserializeStmts) {
                methodStmts.push(stmt.text.replaceAll("OFFSET", `changetype<usize>(input) + offset + <usize>${fluidOffset}`).replaceAll(" + <usize>0", ""));
                keyStmts.push(stmt.text.replaceAll("OFFSET", `changetype<usize>(out) + offset + <usize>${baseOffset}`).replaceAll(" + <usize>0", ""));
                baseOffset += stmt.offset;
                fluidOffset += stmt.offset;
            }
        }
        let id = 0;
        return {
            keyStmts: keyStmts,
            methodStmts: methodStmts,
            methodText: `@inline __TBS_Deserialize(input: ArrayBuffer, out: ${schema.name}, offset: usize = 0): ${schema.name} {\n    ${methodStmts.join("\n    ")}\n}`,
            keyText: `@inline __TBS_Deserialize_Key(key: i32, input: ArrayBuffer, out: ${schema.name}, offset: usize = 0): ${schema.name} {\n    ` + "switch (key) {\n        " + keyStmts.map(v => `    case ${id++}: {\n            ${v}\n            break;\n        }`).join("\n    "),
        }
    }
}

const generator = new TBSGenerator();

const schema = new TBSSchema("Vec3", ["x", "y", "z"], [new TBSType("f32", []), new TBSType("f32", []), new TBSType("f32", [])]);

const serializeMethod = generator.generateSerializeMethods(schema);
console.log(serializeMethod.keyStmts, "\n", serializeMethod.keyText);
console.log(serializeMethod.methodStmts, "\n", serializeMethod.methodText);

const deserializeMethod = generator.generateDeserializeMethods(schema);
console.log(deserializeMethod.keyStmts, "\n", deserializeMethod.keyText);
console.log(deserializeMethod.methodStmts, "\n", deserializeMethod.methodText);

console.log(stringToUint8Array("Hello World!"));
const u8Arr = stringToUint8Array("Hello World!");
console.log(new Uint32Array(u8Arr.buffer, u8Arr.byteOffset, u8Arr.byteLength / 4));
console.log(hashStr("Hello World"));
// 690424818
/*
72, 101, 108, 108, 111,
   32,  87, 111, 114, 108,
  100,  33
  */

console.log(hash32(123))
  // 2084472513