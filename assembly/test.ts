import { TBS } from "./src/tbs";


// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value
// @ts-ignore
@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    name!: string
    /*__TBS_Deserialize(buffer: ArrayBuffer): void {
        this.x = load<i8>(changetype<usize>(buffer) + <usize>0);
        this.y = load<i8>(changetype<usize>(buffer) + <usize>1);
        this.z = load<i8>(changetype<usize>(buffer) + <usize>2);
        this.name = load<string>(changetype<usize>(buffer) + <usize>0);
    }
    __TBS_Serialize(): ArrayBuffer {
        const buffer = changetype<ArrayBuffer>(__new(7 + this.name.length, idof<ArrayBuffer>()));
        store<i8>(changetype<usize>(buffer) + <usize>0, this.x);
        store<i8>(changetype<usize>(buffer) + <usize>1, this.y);
        store<i8>(changetype<usize>(buffer) + <usize>2, this.z);
        store<u32>(changetype<usize>(buffer) + <usize>3, this.name.length);
        memory.copy(changetype<usize>(buffer) + <usize>7, changetype<usize>(String.UTF8.encode(this.name)), <usize>this.name.length);
        return buffer;
    }*/
}

// @ts-ignore
//@tbs
class Player {
    firstName!: string;
    lastName!: string;
    pos!: Vec3 | null;
}

const vec: Vec3 = {
    x: 3,
    y: 2,
    z: 8,
    name: "hello"
}

const player: Player = {
    firstName: "Jairus",
    lastName: "Tanaka",
    pos: {
        x: 3,
        y: 2,
        z: 8,
        name: "vec3"
    }
}

//console.log(toUint8Array(TBS.serialize(player)).join(" "))
// @ts-ignore
function getType(data: i8): string {
    switch (data) {
        case 0: return "Null";
        case 1: return "True";
        case 2: return "False";
        case 3: return "String";
        case 4: return "Array";
        case 5: return "f32";
        case 6: return "f64";
        case 7: return "i32";
        case 8: return "i64";
        default: return "Object"
    }
}

const keys = ["x", "y", "z", "name"];

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
    return Uint8Array.wrap(buffer);
}

function humanify(buffer: ArrayBuffer): string {
    let result = "Type: "
    //const type = load<u8>(changetype<usize>(buffer));
    let i = 1;
    //if (type > 4) i = 0;
    result += "Object" + "\n" + `Key: ${unchecked(keys[0])} Value: ${load<i8>(changetype<usize>(buffer), 0)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 1)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 2)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${String.UTF8.decodeUnsafe(changetype<usize>(buffer) + <usize>7, load<u8>(changetype<usize>(buffer) + <usize>3))}`;
    return result;
}

const serialized = TBS.serialize<Vec3>(vec);
console.log(`Serialized Vec3: ${toUint8Array(serialized).join(" ")}\n${humanify(serialized)}`)
const deserialized = TBS.parse<Vec3>(serialized);
console.log(humanify(TBS.serialize<Vec3>(deserialized)));

const i32serialized = TBS.serialize<i32>(132);
console.log(`Type: ${load<u8>(changetype<usize>(i32serialized), 0)} Data: ${load<i32>(changetype<usize>(i32serialized), 4)}`);

const i64serialized = TBS.serialize<i64>(-132121343424242);
console.log(`Type: ${load<u8>(changetype<usize>(i64serialized), 0)} Data: ${load<i64>(changetype<usize>(i64serialized), 4)}`);

const f32serialized = TBS.serialize<f32>(3.14);
console.log(`Type: ${load<u8>(changetype<usize>(f32serialized), 0)} Data: ${load<f32>(changetype<usize>(f32serialized), 4)}`);

const f64serialized = TBS.serialize<f64>(3.14);
console.log(`Type: ${load<u8>(changetype<usize>(f64serialized), 0)} Data: ${load<f64>(changetype<usize>(f64serialized), 4)}`);

console.log(toUint8Array(TBS.serialize("hello")).join(" "))

console.log(TBS.parse<string>(TBS.serialize<string>("hello")))

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

start = Date.now();