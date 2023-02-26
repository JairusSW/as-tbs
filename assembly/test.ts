import { JSON } from "json-as";

@json
@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
}

@json
@tbs
class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<u8>;
}

const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
}

const pos: Position = {
    moving: true,
    id: 9,
    pos: {
        x: 3,
        y: 1,
        z: 8
    },
    data: [1, 2, 3, 4, 5],
    name: "p1"
};

const serializedVec = new ArrayBuffer(vec.__TBS_Size);

vec.__TBS_Serialize(vec, serializedVec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

const parsedVec = new Vec3();

vec.__TBS_Deserialize(serializedVec, parsedVec);

console.log(JSON.stringify(parsedVec));

const serializedPos = new ArrayBuffer(pos.__TBS_Size);

pos.__TBS_Serialize(pos, serializedPos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

const parsedPos = new Position().__TBS_Instantiate();

pos.__TBS_Deserialize(serializedPos, parsedPos);

console.log(JSON.stringify(parsedPos));