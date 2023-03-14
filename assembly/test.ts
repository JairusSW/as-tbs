import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@json
@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    @inline __TBS_Serialize_Key(key: string, input: Vec3, out: ArrayBuffer, offset: usize = 0): void {
        if (key.length == 1) {
            if (key == "x") {
                store<i8>(changetype<usize>(out) + offset, input.x);
                return;
            }
            if (key == "y") {
                store<i8>(changetype<usize>(out) + offset, input.y);
                return;
            }
            if (key == "z") {
                store<i8>(changetype<usize>(out) + offset, input.z);
                return;
            }
        }
    }
    @inline __TBS_Deserialize_Key(key: i32, input: ArrayBuffer, out: Vec3, offset: usize = 0): void {
        switch (key) {
            case 0: {
                out.x = load<i8>(changetype<usize>(out) + offset);
                break;
            }
            case 1: {
                out.y = load<i8>(changetype<usize>(out) + offset);
                break;
            }
            case 2: {
                out.z = load<i8>(changetype<usize>(out) + offset);
                break;
            }
        }
    }
}

const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
}

const serializedVec = TBS.serialize(vec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

const parsedVec = TBS.parse<Vec3>(serializedVec);

console.log(JSON.stringify(parsedVec));

vec.y = 14;

vec.__TBS_Serialize_Key("y", vec, serializedVec);
// Write "y" to buffer along with its modified value
// Only update "y". Nothing else.

console.log(Uint8Array.wrap(serializedVec).join(" "));

console.log(JSON.stringify(TBS.parse<Vec3>(serializedVec)));