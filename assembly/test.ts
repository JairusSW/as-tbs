import { djb2, getArrayDepth} from "./src/util";
import { TBS, arrayByteLength, serializeDeepArray } from "./src/tbs";
import { JSON } from "json-as";
import { unsafeCharCodeAt } from "json-as/assembly/src/util";
import { Variant } from "as-variant/assembly";

@tbs
@json
class Vec3 {
    x: f32;
    y: f32;
    z: f32;
    //bar: string;
}
/*
//@serializable
class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<f64>;
}

const pos: Position = {
    name: "p1",
    id: 9,
    pos: {
        x: 3,
        y: 1,
        z: 8
    },
    moving: true,
    data: [1.8, 2.2, 3.5, 4.3, 5.9]
};*/

// @ts-ignore
console.log(isDefined(__TBS_Serialize).toString());

// @ts-ignore
const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8,
    //foo: new StaticArray(5),
    //bar: new StaticArray(3)
}
/*
vec.foo[0] = 1;
vec.foo[1] = 2;
vec.foo[2] = 3;
vec.foo[3] = 4;
vec.foo[4] = 5;

vec.bar[0] = 10;
vec.bar[1] = 11;
vec.bar[2] = 12;
*/
const serializedVec3 = new ArrayBuffer(13);
TBS.serializeTo(vec, serializedVec3);

console.log(`Serialized Vec3: ${Uint8Array.wrap(serializedVec3).join(" ")}`);

const deserializedVec3 = new Vec3();
TBS.parseTo<Vec3>(serializedVec3, deserializedVec3);

console.log(JSON.stringify(deserializedVec3));

console.log(`Serialized String: ${Uint8Array.wrap(TBS.serialize("hello")).join(" ")}`);
console.log(`Deserialized String: ${TBS.parse<string>(TBS.serialize("hello"))}`);
/*
console.log(Uint8Array.wrap(TBS.serialize("hello")).join(" "));
const parsedArb = TBS.parse<Variant>(TBS.serialize("hello"));
console.log("Parsed: " + parsedArb.get<string>());
*/
const u8Arb: u8[][] = [[1, 2, 3],[4, 5, 6],[7, 8, 9]];
const buf = new ArrayBuffer(TBS.byteLength(u8Arb));
TBS.serializeTo(u8Arb, buf);
console.log("byteLength: " + TBS.byteLength(u8Arb).toString())
console.log(Uint8Array.wrap(buf).join(" "));
console.log(u8Arb.length.toString());

console.log(Uint8Array.wrap(String.UTF16.encode("Jairus Tanaka")).join(" "))
console.log(Uint8Array.wrap(String.UTF8.encode("Jairus Tanaka")).join(" "))
console.log(Uint8Array.wrap(String.UTF8.encode("pos")).join(" "))
/*
console.log(TBS.parse<Variant>(TBS.serialize(u8Arb)).get<u8[]>().join(" "));
console.log(Uint8Array.wrap(TBS.serialize(<i8>-13)).join(" "));
const parsedNum = TBS.parse<Variant>(TBS.serialize(<u8>231));
if (parsedNum.is<i8>()) {
    console.log((<u8>parsedNum.get<i8>()).toString());
}*/