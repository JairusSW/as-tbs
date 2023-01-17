import { djb2 } from "./src/util";
import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { unsafeCharCodeAt } from "json-as/assembly/src/util";
import { Variant } from "as-variant/assembly";
/*
@global function __TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {
    if (input instanceof Vec3) {
        store<i8>(changetype<usize>(out), input.x);
        store<i8>(changetype<usize>(out) + <usize>1, input.y);
        store<i8>(changetype<usize>(out) + <usize>2, input.z);
        store<u16>(changetype<usize>(out) + <usize>3, input.foo.length);
        memory.copy(changetype<usize>(out) + <usize>5, changetype<usize>(input.foo), input.foo.length);
        return out;
    }
    return unreachable();
}

@global function __TBS_Deserialize<T>(input: ArrayBuffer, out: T): T {
    if (out instanceof Vec3) {
        out.x = load<i8>(changetype<usize>(input));
        out.y = load<i8>(changetype<usize>(input) + <usize>1);
        out.z = load<i8>(changetype<usize>(input) + <usize>2);
        out.foo = instantiate<StaticArray<u8>>(load<u8>(changetype<usize>(input) + <usize>3));
        memory.copy(changetype<usize>(out.foo), changetype<usize>(input) + <usize>5, load<u16>(changetype<usize>(input) + <usize>3));
        return out;
    }
    return unreachable();
}
*/
@tbs
@json
class Vec3 {
    x: i8;
    y: i8;
    z: i8;
    foo!: StaticArray<u8>;
    bar!: StaticArray<u8>;
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
console.log(isDefined(__TBS_Serialize).toString());

// @ts-ignore
const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8,
    foo: new StaticArray(5),
    bar: new StaticArray(3)
}
vec.foo[0] = 1;
vec.foo[1] = 2;
vec.foo[2] = 3;
vec.foo[3] = 4;
vec.foo[4] = 5;

vec.bar[0] = 10;
vec.bar[1] = 11;
vec.bar[2] = 12;

const serializedVec3 = new ArrayBuffer(13);
TBS.serializeTo(vec, serializedVec3);

console.log(`Serialized Vec3: ${Uint8Array.wrap(serializedVec3).join(" ")}`);

const deserializedVec3 = new Vec3();
TBS.parseTo<Vec3>(serializedVec3, deserializedVec3);

console.log(JSON.stringify(deserializedVec3));

console.log(`Serialized String: ${Uint8Array.wrap(TBS.serialize("hello")).join(" ")}`);
console.log(`Deserialized String: ${TBS.parse<string>(TBS.serialize("hello"))}`);

console.log(Uint8Array.wrap(TBS.serialize("hello")).join(" "));
const parsedArb = TBS.parse<Variant>(TBS.serialize("hello"));
console.log("Parsed: " + parsedArb.get<string>());