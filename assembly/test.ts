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

const posTo: Position = {
    moving: true,
    id: 0,
    pos: {
        x: 0,
        y: 0,
        z: 0
    },
    data: [0, 0, 0, 0, 0],
    name: ""
};

const serializedVec = TBS.serialize(vec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

console.log(JSON.stringify(__TBS_Deserialize<Vec3>(TBS.serialize(vec), vec)));

const serializedPos = TBS.serialize(pos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

console.log(JSON.stringify(__TBS_Deserialize<Position>(TBS.serialize(pos), posTo)))