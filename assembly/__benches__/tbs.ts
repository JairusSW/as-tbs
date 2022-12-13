import { TBS } from "../src/tbs";

@tbs
class Vec3 {
    x!: i32;
    y!: i32;
    z!: i32;
}

const vec: Vec3 = {
    x: 3,
    y: 2,
    z: 8
};

const serialized = blackbox(TBS.serialize<Vec3>(vec));

bench("Serialize Vec3", () => {
    blackbox(1+1);
});

bench("Parse Vec3", () => {
    blackbox(TBS.parse<Vec3>(serialized));
});