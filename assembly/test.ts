import { JSON } from "json-as";
import { TBS } from "./src/tbs";

@global function __TBS_Serialize<T>(input: T, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {
    if (input instanceof Vec3) {
        store<i8>(changetype<usize>(out) + offset, input.x);
        store<i8>(changetype<usize>(out) + offset + <usize>1, input.y);
        store<i8>(changetype<usize>(out) + offset + <usize>2, input.z);
        return out;
    } else if (input instanceof Position) {
        store<u8>(changetype<usize>(out) + offset, input.moving);
        store<i8>(changetype<usize>(out) + offset + <usize>1, input.id);
        __TBS_Serialize(input.pos, out, 2);
        store<u16>(changetype<usize>(out) + offset + <usize>5, input.data.length);
        memory.copy(changetype<usize>(out) + offset + <usize>7, changetype<usize>(input.data.buffer), input.data.length);
        store<u16>(changetype<usize>(out) + offset + <usize>7 + <usize>input.data.length, input.name.length);
        memory.copy(changetype<usize>(out) + offset + <usize>9 + <usize>input.data.length, changetype<usize>(input.name), input.name.length << 1);
        return out;
    }
    return unreachable();
}
@global function __TBS_Deserialize<T>(input: ArrayBuffer, out: T, offset: usize = 0): T {
    if (out instanceof Vec3) {
        out.x = load<i8>(changetype<usize>(input) + offset);
        out.y = load<i8>(changetype<usize>(input) + offset + <usize>1);
        out.z = load<i8>(changetype<usize>(input) + offset + <usize>2);
        return out;
    } else if (out instanceof Position) {
        out.moving = load<boolean>(changetype<usize>(input) + offset);
        out.id = load<i8>(changetype<usize>(input) + offset + <usize>1);
        __TBS_Deserialize<Vec3>(input, out.pos, 2);
        out.data = instantiate<Array<u8>>(load<u8>(changetype<usize>(input) + offset + <usize>5));
        memory.copy(changetype<usize>(out.data.buffer), changetype<usize>(input) + offset + <usize>7, load<u16>(changetype<usize>(input) + offset + <usize>5));
        out.name = String.UTF16.decodeUnsafe(changetype<usize>(input) + offset + <usize>9 + <usize>out.data.length, load<u16>(changetype<usize>(input) + offset + <usize>7 + <usize>out.data.length) << 1);
        return out;
    }
    return unreachable();
}

//@serializable
@json
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    @inline get __TBS_ByteLength(): i32 {
        return 3;
    }
}

//@serializable
@json
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