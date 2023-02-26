import { JSON } from "json-as";
import { TBS } from "./src/tbs";

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

const serializedVec = TBS.serialize(vec);//new ArrayBuffer(TBS.sizeOf<Vec3>(vec));

//TBS.serialize(vec, serializedVec);

console.log(Uint8Array.wrap(serializedVec).join(" "));

const parsedVec = TBS.parse<Vec3>(serializedVec);//new Vec3();

//TBS.parse<Vec3>(serializedVec, parsedVec);

console.log(JSON.stringify(parsedVec));

const serializedPos = TBS.serialize(pos);//new ArrayBuffer(TBS.sizeOf<Position>(pos));

//TBS.serialize(pos, serializedPos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

const parsedPos = TBS.parse<Position>(serializedPos);//new Position().__TBS_Instantiate();

//TBS.parse<Position>(serializedPos, parsedPos);

console.log(JSON.stringify(parsedPos));