import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@json
@tbs
class Vec3 {
    ign!: string;
    id!: string;
    x!: i8;
    y!: i8;
    z!: i8;
    @inline get __TBS_Size(): i32 {
        return 3 + this.id.length + this.ign.length;
    }
    @inline __TBS_Instantiate(): Vec3 {
        return new Vec3();
    }
}

const vec: Vec3 = {
    ign: "ItsJairus",
    id: "P4!xdS-",
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