import { TBS } from "../src/tbs";

class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    @inline get __TBS_ByteLength(): i32 {
        return 3;
    }
    @inline __TBS_Serialize(input: Vec3, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {
        store<i8>(changetype<usize>(out) + offset, input.x);
        store<i8>(changetype<usize>(out) + offset + <usize>1, input.y);
        store<i8>(changetype<usize>(out) + offset + <usize>2, input.z);
        return out;
    }
    @inline __TBS_Deserialize(input: ArrayBuffer, out: Vec3, offset: usize = 0): Vec3 {
        out.x = load<i8>(changetype<usize>(input) + offset);
        out.y = load<i8>(changetype<usize>(input) + offset + <usize>1);
        out.z = load<i8>(changetype<usize>(input) + offset + <usize>2);
        return out;
    }
}

class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<u8>;
    @inline get __TBS_ByteLength(): i32 {
        return 6 + this.data.length + (this.name.length << 1) + this.pos.__TBS_ByteLength;
    }
    @inline __TBS_Serialize(input: Position, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {
        store<boolean>(changetype<usize>(out) + offset, input.moving);
        store<i8>(changetype<usize>(out) + offset + <usize>1, input.id);
        input.pos.__TBS_Serialize(input.pos, out, 2);
        store<u16>(changetype<usize>(out) + offset + <usize>5, input.data.length);
        memory.copy(changetype<usize>(out) + offset + <usize>7, changetype<usize>(input.data.buffer), input.data.length);
        store<u16>(changetype<usize>(out) + offset + <usize>7 + <usize>input.data.length, input.name.length);
        memory.copy(changetype<usize>(out) + offset + <usize>9 + <usize>input.data.length, changetype<usize>(input.name), input.name.length << 1);
        return out;
    }
    @inline __TBS_Deserialize(input: ArrayBuffer, out: Position, offset: usize = 0): Position {
        out.moving = load<boolean>(changetype<usize>(input) + offset);
        out.id = load<i8>(changetype<usize>(input) + offset + <usize>1);
        //out.pos = changetype<nonnull<Vec3>>(__new(offsetof<nonnull<Vec3>>(), idof<nonnull<Vec3>>()));
        out.pos.__TBS_Deserialize(input, out.pos, 2);
        out.data = instantiate<Array<u8>>(load<u8>(changetype<usize>(input) + offset + <usize>5));
        memory.copy(changetype<usize>(out.data.buffer), changetype<usize>(input) + offset + <usize>7, load<u16>(changetype<usize>(input) + offset + <usize>5));
        out.name = String.UTF16.decodeUnsafe(changetype<usize>(input) + offset + <usize>9 + <usize>out.data.length, load<u16>(changetype<usize>(input) + offset + <usize>7 + <usize>out.data.length) << 1);
        return out;
    }
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

const serializedVec3 = new ArrayBuffer(vec.__TBS_ByteLength);
vec.__TBS_Serialize(vec, serializedVec3);
const serializedPos = new ArrayBuffer(pos.__TBS_ByteLength);
pos.__TBS_Serialize(pos, serializedPos);
const serializedI32 = blackbox(TBS.serialize<i32>(314));
const serializedString = blackbox(TBS.serialize<string>("hello"));

bench("Serialize Vec3", () => {
    blackbox(vec.__TBS_Serialize(vec, serializedVec3));
});

bench("Parse Vec3", () => {
    blackbox(vec.__TBS_Deserialize(serializedVec3, vec));
});

bench("Serialize Position", () => {
    blackbox(pos.__TBS_Serialize(pos, serializedPos));
});

bench("Parse Position", () => {
    blackbox(pos.__TBS_Deserialize(serializedPos, pos));
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