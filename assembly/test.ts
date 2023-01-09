//import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { TBS, string8 } from "./src/tbs";
import { unsafeCharCodeAt } from "json-as/assembly/src/util";

//@serializable
@serializable
class Vec3 {
    x: i8;
    y: i8;
    z: i8;
}

@serializable
class Position {
    name!: string8;
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
};


// @ts-ignore
@inline function __TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {
    if (input instanceof Vec3) {
        store<i8>(changetype<usize>(out), input.x);
        store<i8>(changetype<usize>(out) + <usize>1, input.y);
        store<i8>(changetype<usize>(out) + <usize>2, input.z);
        return out;
    } else if (input instanceof Position) {
        store<u8>(changetype<usize>(out), input.name.length);
        memory.copy(changetype<usize>(out) + <usize>1, changetype<usize>(String.UTF8.encode(input.name)), <usize>input.name.length);
        store<i8>(changetype<usize>(out) + <usize>1 + <usize>input.name.length, input.id);
        __TBS_Serialize(input.pos, changetype<ArrayBuffer>(changetype<usize>(out) + <usize>2 + <usize>input.name.length));
        // @ts-ignore
        store<u8>(changetype<usize>(out) + <usize>5 + <usize>input.name.length, input.moving);
        store<u8>(changetype<usize>(out) + <usize>6 + <usize>input.name.length, input.data.length << 3);
        memory.copy(changetype<usize>(out) + <usize>7 + <usize>input.name.length, input.data.dataStart, input.data.length << 3);
    }
    return unreachable();
}

// @ts-ignore
@inline function __TBS_Deserialize<T>(input: ArrayBuffer, out: T): T {
    if (out instanceof Vec3) {
        out.x = load<i8>(changetype<usize>(input));
        out.y = load<i8>(changetype<usize>(input) + <usize>1);
        out.z = load<i8>(changetype<usize>(input) + <usize>2);
        return out;
    } else if (out instanceof Position) {
        out.name = String.UTF8.decodeUnsafe(changetype<usize>(input) + <usize>1, load<u8>(changetype<usize>(input) + <usize>0));
        out.id = load<i8>(changetype<usize>(input) + <usize>1 + <usize>out.name.length);
        __TBS_Deserialize(changetype<ArrayBuffer>(changetype<usize>(input) + <usize>2 + <usize>out.name.length), out.pos);
        out.moving = load<boolean>(changetype<usize>(input) + <usize>5 + <usize>out.name.length);
        out.data = instantiate<Array<f64>>(load<u8>(changetype<usize>(input) + <usize>6 + <usize>out.name.length) >> 3);
        // @ts-ignore
        memory.copy(changetype<usize>(out.data.buffer), changetype<usize>(input) + <usize>7 + <usize>out.name.length, load<u8>(changetype<usize>(input) + <usize>6 + <usize>out.name.length));
    }
    return unreachable();
}

// @ts-ignore
const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
}

const serializedVec3 = new ArrayBuffer(3);
__TBS_Serialize(vec, serializedVec3);

console.log(`Serialized Vec3: ${Uint8Array.wrap(serializedVec3).join(" ")}`);

const deserializedVec3 = new Vec3();
__TBS_Deserialize<Vec3>(serializedVec3, deserializedVec3);

console.log(JSON.stringify(deserializedVec3));

console.log(`Serialized String: ${Uint8Array.wrap(TBS.serialize("hello")).join(" ")}`);
console.log(`Deserialized String: ${TBS.parse<string>(TBS.serialize("hello"))}`);
















/*

const serializedPosition = TBS.serialize(pos);
const arr = new StaticArray<u8>(1);
//console.log(arr[5].toString());
console.log(Uint8Array.wrap(serializedPosition).join(" "));

//TBS.serializeTo<Vec3>(pos.pos, new ArrayBuffer(1));

const parsedPosition = TBS.parse<Position>(serializedPosition);

console.log(Uint8Array.wrap(TBS.serialize(parsedPosition)).join(" "));

console.log(`TBS is ${serializedPosition.byteLength} bytes long\nJSON is ${JSON.stringify(parsedPosition).length} bytes long\nTBS is ${JSON.stringify(parsedPosition).length - serializedPosition.byteLength} bytes smaller than JSON.`);

console.log(`{
    name: "${parsedPosition.name}",
    id: ${parsedPosition.id},
    pos: {
        x: ${parsedPosition.pos.x},
        y: ${parsedPosition.pos.y},
        z: ${parsedPosition.pos.z}
    }
}`);

//console.log(JSON.stringify(parsedPosition));

const serializedVec3 = TBS.serialize(pos.pos);

console.log(Uint8Array.wrap(serializedVec3).join(" "));

const parsedVec3 = TBS.parse<Vec3>(serializedVec3);

console.log(JSON.stringify(parsedVec3));



console.log(JSON.stringify(TBS.parse<Vec3>(serializedVec3)));*/