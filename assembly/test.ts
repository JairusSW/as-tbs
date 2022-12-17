import { TBS } from "./src/tbs";

// ObjectID, KeyID, ValueLength, ...Value, KeyID, ValueLength, ...Value
// @ts-ignore
@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    valid!: boolean;
    name!: string;
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

const vec: Vec3 = {
    x: 2,
    y: 5,
    z: 3,
    valid: true,
    name: "TBS sickk bro"
}
const keys = ["valid", "x", "y", "z", "name"];

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
    return Uint8Array.wrap(buffer);
}

function humanify(buffer: ArrayBuffer): string {
    let result = "Type: Object\n"
    //const type = load<u8>(changetype<usize>(buffer));
    let i = 1;
    //if (type > 4) i = 0;
    result += `Key: ${unchecked(keys[0])} Value: ${load<u8>(changetype<usize>(buffer), 0) == 1 ? true : false}\n`
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 1)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 2)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${load<i8>(changetype<usize>(buffer), 3)}\n`;
    result += `Key: ${unchecked(keys[i++])} Value: ${String.UTF8.decodeUnsafe(changetype<usize>(buffer) + <usize>8, load<u8>(changetype<usize>(buffer) + <usize>4))}`;
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

start = Date.now();