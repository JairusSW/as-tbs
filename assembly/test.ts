import { djb2 } from "./src/util";
import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { unsafeCharCodeAt } from "json-as/assembly/src/util";
import { Variant } from "as-variant/assembly";

@serializable
class Vec3 {
    x: i8;
    y: i8;
    z: i8;
}

//@serializable
class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<f64>;
}

const pos: Position = {
    name: "p1",
    id: 9,
    pos: {
        x: 3,
        y: 1,
        z: 8
    },
    moving: true,
    data: [1.8, 2.2, 3.5, 4.3, 5.9]
};
console.log(isDefined(__TBS_Serialize).toString());

// @ts-ignore
const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
}

const serializedVec3 = new ArrayBuffer(3);
TBS.serializeTo(vec, serializedVec3);

console.log(`Serialized Vec3: ${Uint8Array.wrap(serializedVec3).join(" ")}`);

const deserializedVec3 = new Vec3();
TBS.parseTo<Vec3>(serializedVec3, deserializedVec3);

console.log(JSON.stringify(deserializedVec3));

console.log(`Serialized String: ${Uint8Array.wrap(TBS.serialize("hello")).join(" ")}`);
console.log(`Deserialized String: ${TBS.parse<string>(TBS.serialize("hello"))}`);

console.log(Uint8Array.wrap(TBS.serialize("hello")).join(" "));
const parsedArb = TBS.parse<Variant>(TBS.serialize("hello"));
console.log("Parsed: " + parsedArb.get<string>());