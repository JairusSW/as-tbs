import { TBS } from "../src/tbs";

// @ts-ignore
//@tbs
const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    __TBS_Deserialize(buffer: ArrayBuffer): void {
        this.x = load<i8>(changetype<usize>(buffer) + <usize>0);
        this.y = load<i8>(changetype<usize>(buffer) + <usize>1);
        this.z = load<i8>(changetype<usize>(buffer) + <usize>2);
    }
    __TBS_Serialize(): ArrayBuffer {
        store<i8>(changetype<usize>(buffer) + <usize>0, this.x);
        store<i8>(changetype<usize>(buffer) + <usize>1, this.y);
        store<i8>(changetype<usize>(buffer) + <usize>2, this.z);
        return buffer;
    }
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
    blackbox(TBS.parseTo<Vec3>(serializedVec3, vec));
});
/*
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
});*/