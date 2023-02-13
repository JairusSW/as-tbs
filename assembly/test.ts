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
    __TBS_Serialize(input: Position, out: ArrayBuffer, offset: usize = 0): ArrayBuffer {
        store<boolean>(changetype<usize>(out) + offset, input.moving);
        store<i8>(changetype<usize>(out) + offset + <usize>1, input.id);
        input.pos.__TBS_Serialize(input.pos, out, 2);
        store<u16>(changetype<usize>(out) + offset + <usize>5, input.data.length);
        memory.copy(changetype<usize>(out) + offset + <usize>7, changetype<usize>(input.data.buffer), input.data.length);
        store<u16>(changetype<usize>(out) + offset + <usize>7 + <usize>input.data.length, input.name.length);
        memory.copy(changetype<usize>(out) + offset + <usize>9 + <usize>input.data.length, changetype<usize>(input.name), input.name.length << 1);
        return out;
    }
    __TBS_Deserialize(input: ArrayBuffer, out: Position, offset: usize = 0): Position {
        out.moving = load<boolean>(changetype<usize>(input) + offset);
        out.id = load<i8>(changetype<usize>(input) + offset + <usize>1);
        //out.pos = changetype<nonnull<Vec3>>(__new(offsetof<nonnull<Vec3>>(), idof<nonnull<Vec3>>()));
        out.pos.__TBS_Deserialize(input, out.pos, 2);
        //out.data = instantiateArrayWithBuffer<Array<u8>>(input, offset + <usize>7, 5);// instantiate<Array<u8>>(load<u8>(changetype<usize>(input) + offset + <usize>5));
        out.data.buffer = input.slice(offset + 7, offset + 7 + 5);
        store<usize>(changetype<usize>(out.data), changetype<usize>(out.data.buffer), offsetof<Array<u8>>("dataStart")); //memory.copy(changetype<usize>(out.data.buffer), changetype<usize>(input) + offset + <usize>7, load<u16>(changetype<usize>(input) + offset + <usize>5));
        out.name = String.UTF16.decodeUnsafe(changetype<usize>(input) + offset + <usize>9 + <usize>out.data.length, load<u16>(changetype<usize>(input) + offset + <usize>7 + <usize>out.data.length) << 1);
        return out;
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

const parsedVec: Vec3 = {
    x: 0,
    y: 0,
    z: 0
};

vec.__TBS_Deserialize(serializedVec, parsedVec);

console.log(JSON.stringify(parsedVec));

const serializedPos = new ArrayBuffer(pos.__TBS_ByteLength);

pos.__TBS_Serialize(pos, serializedPos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

const parsedPos = pos;

pos.__TBS_Deserialize(serializedPos, parsedPos);

console.log(JSON.stringify(parsedPos));

const arr = new Array<u8>(3);

memory.copy(arr.dataStart, changetype<usize>(serializedVec), 3);

console.log(JSON.stringify(arr));