import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@json
@tbs
class Vec3 {
    x!: f64;
    y!: f64;
    z!: f64;
}

const vec: Vec3 = {
    x: 33.7,
    y: -19.1,
    z: 81.6
}

const serializedVec = TBS.serialize(vec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

const parsedVec = TBS.parse<Vec3>(serializedVec);

console.log(JSON.stringify(parsedVec));

vec.x = 73.2;

vec.__TBS_Serialize_Key("x", vec, serializedVec);
// Write "y" to buffer along with its modified value
// Only update "y". Nothing else.

console.log(Uint8Array.wrap(serializedVec).join(" "));

console.log(JSON.stringify(TBS.parse<Vec3>(serializedVec)));