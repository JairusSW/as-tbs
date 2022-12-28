//import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { TBS, string8 } from "./src/tbs";
// type string8 = string;
// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value

// @ts-ignore
@serializable
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    /*@inline
    __TBS_Instantiate(): Vec3 {
        return changetype<Vec3>(__new(offsetof<Vec3>(), idof<Vec3>()));
    }*/
    //private __TBS_ByteLength: i32 = 3;
}

// @ts-ignore
@serializable
class Position {
    name!: string8;
    coords!: Vec3;
    /*@inline
    __TBS_Instantiate(): Position {
        const result = changetype<Position>(__new(offsetof<Position>(), idof<Position>()));
        result.coords = vec.__TBS_Instantiate();
        return result;
    }*/
}

const vec: Vec3 = {
    x: 2,
    y: 5,
    z: 3
}

const pos: Position = {
    name: "jairus",
    // 106 97 105 114 117 115
    coords: {
        x: 2,
        y: 5,
        z: 3
    }
}

const serialized = TBS.serialize(pos);
console.log(Uint8Array.wrap(serialized).join(" "));

store<i8>(changetype<usize>(vec) + offsetof<Vec3>("y"), 9);
console.log(Uint8Array.wrap(TBS.serialize(vec)).join(" "));
const parsed = TBS.parse<Position>(serialized);

console.log(Uint8Array.wrap(TBS.serialize(parsed)).join(" "));
console.log(JSON.stringify(parsed));
/*
const keys = ["x", "y", "z"] //["valid", "x", "y", "z", "name"];

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
    return Uint8Array.wrap(buffer);
}

function humanify(buffer: ArrayBuffer): string {
    let result = "Type: Object\n"
    //const type = load<u8>(changetype<usize>(buffer));
    let i = 1;
    //if (type > 4) i = 0;
    // result += `Key: ${unchecked(keys[0])} Value: ${load<u8>(changetype<usize>(buffer), 0) == 1 ? true : false}\n`
    result += `Key: ${unchecked(keys[0])} Value: ${load<i8>(changetype<usize>(buffer), 0)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 1)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 2)}\n`;
    //result += `Key: ${unchecked(keys[i++])} Value: ${String.UTF16.decodeUnsafe(changetype<usize>(buffer) + <usize>8, load<u8>(changetype<usize>(buffer) + <usize>4))}`;
    return result;
}

const serialized = TBS.serialize<Vec3>(TBS.parse<Vec3>(TBS.serialize<Vec3>(vec)));
console.log(`Serialized Vec3: ${toUint8Array(serialized).join(" ")}\n${humanify(serialized)}`)
const deserialized = TBS.parse<Vec3>(serialized);

let times = 5_000_000;
let warmup = 5_000;

while (warmup--) {
    TBS.serialize<Vec3>(vec);
}

let start = Date.now();
while (times--) {
    TBS.serialize<Vec3>(vec);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Serialize Vec3: ${Date.now() - start}ms`);

while (warmup--) {
    TBS.parse<Vec3>(serialized);
}

start = Date.now();
while (times--) {
    TBS.parse<Vec3>(serialized);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Deserialize Vec3: ${Date.now() - start}ms`);
/*
start = Date.now();

while (warmup--) {
    TBS.serializeField<Vec3>(vec, 1);
}

start = Date.now();
while (times--) {
    TBS.serializeField<Vec3>(vec, 1);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Serialize Field Vec3: ${Date.now() - start}ms`);

while (warmup--) {
    TBS.parseField<Vec3>(vec, 1);
}

start = Date.now();
while (times--) {
    TBS.parseField<Vec3>(vec, 1);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Parse Field Vec3: ${Date.now() - start}ms`);*/