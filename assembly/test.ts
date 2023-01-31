import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@serializable
class Vec3 {
    x!: i32;
    y!: i32;
    z!: i32;
    @inline get __TBS_ByteLength(): i32 {
        return 3 << 2;
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
        return 6 + this.data.length + (this.name.length << 1);
    }
}

const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
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
    data: [1, 2, 3, 4, 5]
};

const serializedVec = TBS.serialize(vec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

console.log(JSON.stringify(__TBS_Deserialize<Vec3>(TBS.serialize(vec), vec)));

const serializedPos = TBS.serialize(pos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

console.log(JSON.stringify(__TBS_Deserialize<Position>(TBS.serialize(pos), pos)))