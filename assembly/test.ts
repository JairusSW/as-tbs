//import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { TBS, string8 } from "./src/tbs";
// type string8 = string;
// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value
// If you add JSON, don't add the @json decorator. @serializable works here.

// @ts-ignore
@serializable
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
}

// @ts-ignore
@serializable
class Position {
    name!: string8;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<u8>;
    /*
    @inline
    __TBS_Instantiate(): Position {
        const result = changetype<Position>(__new(offsetof<Position>(), idof<Position>()));
        //result.pos = changetype<Vec3>(__new(offsetof<Vec3>(), idof<Vec3>())).__TBS_Instantiate();
        //result.data = new Array<u8>();
        return result;
    }
    @inline
    __TBS_ByteLength(): i32 {
        return this.data.length;
    }
    @inline
    __TBS_Deserialize(input: ArrayBuffer, out: Position): void {
        out.data = new Array<u8>(load<u8>(changetype<usize>(input)));
        memory.copy(changetype<usize>(out.data.buffer), changetype<usize>(input) + <usize>1, load<u8>(changetype<usize>(input)));
    }
    @inline
    __TBS_Serialize(input: Position, out: ArrayBuffer): void {
        store<u8>(changetype<usize>(out), input.data.length);
        memory.copy(changetype<usize>(out) + <usize>1, input.data.dataStart, <usize>input.data.length);;
    }*/
}

const pos: Position = {
    name: "Markus Persson",
    id: 9,
    pos: {
        x: 3,
        y: 1,
        z: 8
    },
    moving: true,
    data: [1, 2, 3, 4, 5]
};

const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
}

const serialized = TBS.serialize(pos);
const parsed = TBS.parse<Position>(serialized);

console.log(Uint8Array.wrap(serialized).join(" "));
console.log(JSON.stringify(parsed));/*
const arr: u8[] = [1,2,3,4,5,6]
const buffer = new ArrayBuffer(7);
store<u8>(changetype<usize>(buffer), arr.length);
memory.copy(changetype<usize>(buffer) + <usize>1, arr.dataStart, <usize>arr.length);

const parsed = new Array<u8>(6);
memory.copy(changetype<usize>(parsed.buffer), changetype<usize>(buffer) + <usize>1, <usize>arr.length);

console.log(Uint8Array.wrap(buffer).join(" "));
console.log(parsed.join(" "))
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