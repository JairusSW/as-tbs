import { TBS } from "../src/tbs";

@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
}

@tbs
class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<u8>;
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

const vec: Vec3 = {
    x: 3,
    y: 1,
    z: 8
};


const serializedVec3 = new ArrayBuffer(TBS.sizeOf<Vec3>(vec));
const serializedPos = new ArrayBuffer(TBS.sizeOf<Position>(pos));
const serializedString = blackbox(TBS.serialize<string>("hello"));
const str = "hello";

bench("Serialize Vec3", () => {
    blackbox(TBS.serialize(vec, serializedVec3));
});

bench("Parse Vec3", () => {
    blackbox(TBS.parse<Vec3>(serializedVec3, vec));
});

bench("Serialize Position", () => {
    blackbox(TBS.serialize(pos, serializedPos));
});

bench("Parse Position", () => {
    blackbox(TBS.parse(serializedPos, pos));
});

bench("Serialize String", () => {
    blackbox(TBS.serialize<string>(str, serializedString));
});

bench("Parse String", () => {
    blackbox(TBS.parse<string>(serializedString, str));
});