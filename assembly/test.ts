import { decimalCount32 } from "assemblyscript/std/assembly/util/number";
import { JSON } from "json-as/assembly";
import { ASON } from "@ason/assembly";

const NullID = 0;
const ObjectID = 1;
const StringID = 2;
const ArrayID = 3;
const NumberID = 4;
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
@inline
function serialize<T>(data: T): i32[] {
    // @ts-ignore
    if ((isInteger<T>() || isFloat<T>()) && isFinite(data)) {
        // @ts-ignore
        return [NumberID, data];
    } else if (isString<T>()) {
        // @ts-ignore
        return [StringID, NullID];
        // @ts-ignore
    } else if (isDefined(data.__TBS_Serialize)) {
        // @ts-ignore
        return data.__TBS_Serialize();
    }
    return unreachable();
}

// @ts-ignore
@inline
function parse<T extends Vec3>(data: i32[]): T {
    let type: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
    // @ts-ignore
    if (isDefined(type.__TBS_Deserialize)) {
        // @ts-ignore
        type.__TBS_Deserialize(data);
        return type;
    }
    return unreachable();
}

// @ts-ignore
function getType(data: i32): string {
    switch (data) {
        case 0: return "Null";
        case 1: return "Object";
        case 2: return "String";
        case 3: return "Array";
        case 4: return "Number";
        default: return unreachable()
    }
}

const keys = ["x","y","z"]

function humanify(data: i32[]): string {
    let result = "Type: "
    const type = unchecked(data[0]);
    result += getType(type) + "\n" + `Key: ${unchecked(keys[0])} Value: ${unchecked(data[1])}\n`;
    let i = 1;
    while (i < data.length - 1) {
        result += `Key: ${unchecked(keys[i])} Value: ${unchecked(data[++i])}\n`;
    }
    return result;
}

const serialized = serialize<Vec3>(vec);
console.log(`Serialized Vec3: ${serialized.join(" ")}\n${humanify(serialized)}`)
const deserialized = parse<Vec3>(serialized);
console.log(humanify(serialize<Vec3>(deserialized)));

let times = 5_000_000;
let start = Date.now();
let warmup = 5_000;
while (warmup-- > 0) {
    serialize<Vec3>(vec);
}

while (times-- > 0) {
    serialize<Vec3>(vec);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Serialize Vec3: ${Date.now() - start}ms`);

start = Date.now();

while (warmup-- > 0) {
    parse<Vec3>(serialized);
}

while (times-- > 0) {
    parse<Vec3>(serialized);
}

times = 5_000_000;
warmup = 5_000;

console.log(`Deserialize Vec3: ${Date.now() - start}ms`);

start = Date.now();