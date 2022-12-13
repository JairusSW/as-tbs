import { TBS } from "./src/tbs";

// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value
@tbs
class Vec3 {
    x!: i32;
    y!: i32;
    z!: i32;
}

const vec: Vec3 = {
    x: 3,
    y: 2,
    z: 8
}

// @ts-ignore
function getType(data: i8): string {
    switch (data) {
        case 0: return "Null";
        case 1: return "String";
        case 2: return "Array";
        case 3: return "Number";
        default: return "Object"
    }
}

const keys = ["x", "y", "z"];

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
    return Uint8Array.wrap(buffer);
}

function humanify(buffer: ArrayBuffer): string {
    let result = "Type: "
    let offset = 0;
    //const type = load<u8>(changetype<usize>(buffer));
    let i = 1;
    //if (type > 4) i = 0;
    result += "Object" + "\n" + `Key: ${unchecked(keys[0])} Value: ${load<i32>(changetype<usize>(buffer), 0)}\n`;
    result += `Key: ${unchecked(keys[++i])} Value: ${unchecked(load<i32>(changetype<usize>(buffer), 4))}\n`;
    result += `Key: ${unchecked(keys[++i])} Value: ${unchecked(load<i32>(changetype<usize>(buffer), 8))}\n`;
    return result;
}

const serialized = TBS.serialize<Vec3>(vec);
console.log(`Serialized Vec3: ${toUint8Array(serialized).join(" ")}\n${humanify(serialized)}`)
const deserialized = TBS.parse<Vec3>(serialized);
console.log(humanify(TBS.serialize<Vec3>(deserialized)));

const i32serialized = TBS.serialize<i32>(132);
console.log(`Type: ${load<i32>(changetype<usize>(i32serialized), 0)} Data: ${load<i32>(changetype<usize>(i32serialized), 4)}`);

const i64serialized = TBS.serialize<i64>(-132121343424242);
console.log(`Type: ${load<i32>(changetype<usize>(i64serialized), 0)} Data: ${load<i64>(changetype<usize>(i64serialized), 4)}`);

const f32serialized = TBS.serialize<f32>(3.14);
console.log(`Type: ${load<i32>(changetype<usize>(f32serialized), 0)} Data: ${load<f32>(changetype<usize>(f32serialized), 4)}`);

const f64serialized = TBS.serialize<f64>(3.14159265358979323846);
console.log(`Type: ${load<i32>(changetype<usize>(f64serialized), 0)} Data: ${load<f64>(changetype<usize>(f64serialized), 4)}`);

console.log(toUint8Array(i64serialized).join(" "))


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