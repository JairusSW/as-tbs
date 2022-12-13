const NullID = 0;
const ObjectID = 1;
const StringID = 2;
const ArrayID = 3;
const NumberID = 4;
import { decimalCount32 } from "assemblyscript/std/assembly/util/number";
import { JSON } from "json-as/assembly";
import { TBS } from "./src/tbs";

// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value
class Vec3 {
    x!: i32;
    y!: i32;
    z!: i32;
    __TBS_Deserialize(buffer: ArrayBuffer): void {
        let offset = 0;
        this.x = load<i32>(changetype<usize>(buffer));
        offset += sizeof<i32>()
        this.y = load<i32>(changetype<usize>(buffer) + <usize>offset);
        offset += sizeof<i32>()
        this.z = load<i32>(changetype<usize>(buffer) + <usize>offset);
    }
    __TBS_Serialize(): ArrayBuffer {
        let offset = 0;
        const buffer = changetype<ArrayBuffer>(__new(
            3<<2,
            idof<ArrayBuffer>())
        );
        store<i32>(changetype<usize>(buffer), this.x);
        offset += sizeof<i32>()
        store<i32>(changetype<usize>(buffer) + <usize>offset, this.y);
        offset += sizeof<i32>()
        store<i32>(changetype<usize>(buffer) + <usize>offset, this.z);
        return buffer;
    }
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
        case 1: return "Object";
        case 2: return "String";
        case 3: return "Array";
        case 4: return "Number";
        default: return "Object"
    }
}

const keys = ["x", "y", "z"];

function toArray(buffer: ArrayBuffer): StaticArray<i32> {
    let length = buffer.byteLength
    let result = new StaticArray<i32>(length);
    memory.copy(
        changetype<usize>(result),
        changetype<usize>(buffer),
        <usize>length,
    );
    return result;
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
console.log(`Serialized Vec3: ${toArray(serialized).join(" ")}\n${humanify(serialized)}`)
const deserialized = TBS.parse<Vec3>(serialized);
console.log(humanify(TBS.serialize<Vec3>(deserialized)));

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