import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@json
@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
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

vec.__TBS_Serialize_Key(1, vec, serializedVec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

console.log(JSON.stringify(TBS.parse<Vec3>(serializedVec)));