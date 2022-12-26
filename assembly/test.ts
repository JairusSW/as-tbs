import { TBS } from "./src/tbs";
type string8 = string;
// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value
// @ts-ignore
//@tbs
const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    __TBS_Deserialize(buffer: ArrayBuffer): void {
        this.x = load<i8>(changetype<usize>(buffer) + <usize>0);
        this.y = load<i8>(changetype<usize>(buffer) + <usize>1);
        this.z = load<i8>(changetype<usize>(buffer) + <usize>2);
    }
    __TBS_Serialize(): ArrayBuffer {
        store<i8>(changetype<usize>(buffer) + <usize>0, this.x);
        store<i8>(changetype<usize>(buffer) + <usize>1, this.y);
        store<i8>(changetype<usize>(buffer) + <usize>2, this.z);
        return buffer;
    }
}

const vec: Vec3 = {
    x: 2,
    y: 5,
    z: 3,
   // valid: true,
   // name: "TBS sickk bro"
}
const keys = ["x","y","z"] //["valid", "x", "y", "z", "name"];

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

const serialized = TBS.serialize<Vec3>(TBS.parseTo<Vec3>(TBS.serialize<Vec3>(vec), vec));
console.log(`Serialized Vec3: ${toUint8Array(serialized).join(" ")}\n${humanify(serialized)}`)
const deserialized = TBS.parseTo<Vec3>(serialized, vec);

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
    TBS.parseTo<Vec3>(serialized, vec);
}

start = Date.now();
while (times--) {
    TBS.parseTo<Vec3>(serialized, vec);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Deserialize Vec3: ${Date.now() - start}ms`);

start = Date.now();