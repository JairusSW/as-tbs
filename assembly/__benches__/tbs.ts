import { TBS } from "../src/tbs";

// @ts-ignore
@tbs
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
}

const vec: Vec3 = {
    x: 3,
    y: 2,
    z: 8
};

const serializedVec3 = blackbox(TBS.serialize<Vec3>(vec));
const serializedI32 = blackbox(TBS.serialize<i32>(314));
const serializedString = blackbox(TBS.serialize<string>("hello"));

bench("Serialize Vec3", () => {
    blackbox(TBS.serialize<Vec3>(vec));
});

bench("Parse Vec3", () => {
    blackbox(TBS.parse<Vec3>(serializedVec3));
});

bench("Serialize String", () => {
    blackbox(TBS.serialize<string>("hello"));
});

bench("Parse String", () => {
    blackbox(TBS.parse<string>(serializedString));
});

bench("Serialize I32", () => {
    blackbox(TBS.serialize<i32>(314));
});

bench("Parse I32", () => {
    blackbox(TBS.parse<i32>(serializedI32));
});