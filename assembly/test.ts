import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@json
@tbs
class Vec3 {
    name!: string;
    x!: i8;
    y!: i8;
    z!: i8;
}

const vec: Vec3 = {
    name: "p1",
    x: 1,
    y: 2,
    z: 3
}

const serializedVec = TBS.serialize(vec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

const parsedVec = TBS.parse<Vec3>(serializedVec);

console.log(JSON.stringify(parsedVec));

vec.x = 4;

vec.__TBS_Serialize_Key("x", vec, serializedVec);
// Write "y" to buffer along with its modified value
// Only update "y". Nothing else.

console.log(Uint8Array.wrap(serializedVec).join(" "));

console.log(JSON.stringify(TBS.parse<Vec3>(serializedVec)));