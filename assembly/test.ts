import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@serializable
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    @inline get __TBS_ByteLength(): i32 {
        return 3;
    }
    @inline __TBS_Instantiate(): Vec3 {
        return new Vec3();
    }
}

@serializable
class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<u8>;
    @inline get __TBS_ByteLength(): i32 {
        return 6 + this.data.length + (this.name.length << 1) + this.pos.__TBS_ByteLength;
    }
    @inline __TBS_Instantiate(): Position {
        const res = new Position();
        res.name = "";
        res.pos = new Vec3();
        res.data = [];
        return res;
    }
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

const serializedVec = new ArrayBuffer(vec.__TBS_ByteLength);

vec.__TBS_Serialize(vec, serializedVec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

const parsedVec = new Vec3();/*: Vec3 = {
    x: 0,
    y: 0,
    z: 0
};*/

vec.__TBS_Deserialize(serializedVec, parsedVec);

console.log(JSON.stringify(parsedVec));

const serializedPos = new ArrayBuffer(pos.__TBS_ByteLength);

pos.__TBS_Serialize(pos, serializedPos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

const parsedPos = changetype<Position>(0).__TBS_Instantiate();

pos.__TBS_Deserialize(serializedPos, parsedPos);

console.log(JSON.stringify(parsedPos));

const arr = new Array<u8>(3);

memory.copy(arr.dataStart, changetype<usize>(serializedVec), 3);

console.log(JSON.stringify(arr));