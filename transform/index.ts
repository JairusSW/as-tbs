import {
    ClassDeclaration,
    FieldDeclaration,
    Parser,
    Statement
} from "assemblyscript/dist/assemblyscript";
import { isStdlib, toString } from "visitor-as/dist/utils.js";
import { BaseVisitor, SimpleParser } from "visitor-as/dist/index.js";
import { Transform } from "assemblyscript/dist/transform.js";

import { TBSGenerator } from "../generator/generator.js";
import { TBSSchema } from "../generator/schema.js";
import { TBSType } from "../generator/type.js";
import { isPrimitive } from "../generator/util.js";

class TBSTransform extends BaseVisitor {
    public schema: TBSSchema = new TBSSchema();
    public schemasList: TBSSchema[] = [];

    public serializeFunc: string = "";
    public deserializeFunc: string = "";
    public instantiateFunc: string = "";
    public sizeFunc: string = "";

    public globalStatements: Statement[] = [];

    visitMethodDeclaration(): void { }
    visitFieldDeclaration(node: FieldDeclaration): void {
        if (toString(node).startsWith("private")) return;
        if (!node.type) return;
        this.schema.keys.push(toString(node.name));
        this.schema.types.push(new TBSType(toString(node.type)));
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

        this.schema = new TBSSchema(node.name.text, [], []);

        this.serializeFunc = `@inline __TBS_Serialize(input: ${node.name.text}, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {\n`;
        this.deserializeFunc = `@inline __TBS_Deserialize(input: ArrayBuffer, out: ${node.name.text}, offset: usize = 0): ${node.name.text} {\n`;
        this.instantiateFunc = `@inline __TBS_Instantiate(): ${node.name.text} {\n`;
        this.sizeFunc = `@inline get __TBS_Size(): i32 {\n`;

        console.log("Visiting Class: " + node.name.text);

        this.visit(node.members);

        const primitiveKeys: string[] = [];
        const primitiveTypes: TBSType[] = [];

        let keys: string[] = [];
        let types: TBSType[] = [];

        for (let i = 0; i < this.schema.keys.length; i++) {
            const type = this.schema.types[i]!;
            const key = this.schema.keys[i]!;
            if (!isPrimitive(type)) {
                primitiveTypes.push(type);
                primitiveKeys.push(key);
            } else {
                types.push(type);
                keys.push(key);
            }
        }

        keys = [...primitiveKeys, ...keys];
        types = [...primitiveTypes, ...types];

        let sorted = [];

        for (let i = 0; i < this.schema.keys.length; i++) {
            const type = this.schema.types[i]!;
            const key = this.schema.keys[i]!;
            const hash = djb2Hash(key);
            sorted.push([key, type, hash]);
        }

        // @ts-ignore
        sorted = sorted.sort((a, b) => a[2] - b[2]);

        for (let i = 0; i < this.schema.keys.length; i++) {
            keys[i] = <string>sorted[i]![0]!;
            types[i] = <TBSType>sorted[i]![1]!;
        }

        //const instantiateMethod = SimpleParser.parseClassMember(this.instantiateFunc, node);
        //const sizeMethod = SimpleParser.parseClassMember(this.sizeFunc, node);

        const generator = new TBSGenerator();

        const schema = new TBSSchema(this.schema.name, keys, types);
        const serializeMethods = generator.generateSerializeMethods(schema);
        const deserializeMethods = generator.generateDeserializeMethods(schema);

        if (!node.members.find(v => v.name.text == "__TBS_Serialize")) {
            console.log(serializeMethods.methodText);
            node.members.push(SimpleParser.parseClassMember(serializeMethods.methodText, node));
        }

        if (!node.members.find(v => v.name.text == "__TBS_Deserialize")) {
            console.log(deserializeMethods.methodText);
            node.members.push(SimpleParser.parseClassMember(deserializeMethods.methodText, node));
        }
/*
        if (!node.members.find(v => v.name.text == "__TBS_Instantiate")) {
            node.members.push(instantiateMethod);
            console.log(this.instantiateFunc);
        }

        if (!node.members.find(v => v.name.text == "__TBS_Size")) {
            node.members.push(sizeMethod);
            console.log(this.sizeFunc);
        }*/

        console.log("Schema: ", schema);
        if (!node.members.find(v => v.name.text == "__TBS_Serialize_Key")) {
            console.log(serializeMethods.keyText);
            node.members.push(SimpleParser.parseClassMember(serializeMethods.keyText, node));
        }

        if (!node.members.find(v => v.name.text == "__TBS_Deserialize_Key")) {
            console.log(deserializeMethods.keyText);
            node.members.push(SimpleParser.parseClassMember(deserializeMethods.keyText, node));
        }

        this.schemasList.push(this.schema);
    }
}

function djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)!) & 0xFFFFFFFF;
    }
    return hash;
}

export default class Transformer extends Transform {
    // Trigger the transform after parse.
    afterParse(parser: Parser): void {
        // Create new transform
        const transformer = new TBSTransform();

        // Sort the sources so that user scripts are visited last
        const sources = parser.sources.filter(source => !isStdlib(source)).sort((_a, _b) => {
            const a = _a.internalPath
            const b = _b.internalPath
            if (a[0] === "~" && b[0] !== "~") {
                return -1;
            } else if (a[0] !== "~" && b[0] === "~") {
                return 1;
            } else {
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
};