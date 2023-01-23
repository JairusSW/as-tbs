/*@serializable
class Vec3 {
    x!: f32;
    y!: f32;
    z!: f32;
}*/

import { JSON } from "json-as";
import { TBS } from "./src/tbs";
@global
function __TBS_Serialize<T>(input: T, out: ArrayBuffer): ArrayBuffer {
    if (input instanceof Position) {
        store<boolean>(changetype<usize>(out), input.moving);
        store<i8>(changetype<usize>(out) + <usize>1, input.id);
        store<u16>(changetype<usize>(out) + <usize>2, input.data.length);
        memory.copy(changetype<usize>(out) + <usize>4, changetype<usize>(input.data.buffer), input.data.length);
        store<u16>(changetype<usize>(out) + <usize>4 + <usize>input.data.length, input.name.length);
        memory.copy(changetype<usize>(out) + <usize>6 + <usize>input.data.length, changetype<usize>(input.name), input.name.length);
        return out;
    }
    return unreachable();
}
@global
function __TBS_Deserialize<T>(input: ArrayBuffer, out: T): T {
    if (out instanceof Position) {
        out.moving = load<boolean>(changetype<usize>(input));
        out.id = load<i8>(changetype<usize>(input) + <usize>1);
        out.data = instantiate<Array<u8>>(load<u8>(changetype<usize>(input) + <usize>2));
        memory.copy(changetype<usize>(out.data.buffer), changetype<usize>(input) + <usize>4, load<u16>(changetype<usize>(input) + <usize>2));
        out.name = String.UTF16.decodeUnsafe(changetype<usize>(input) + <usize>6 + out.data.length, load<u16>(changetype<usize>(input) + <usize>4 + <usize>out.data.length))
        //memory.copy(changetype<usize>(out.name), changetype<usize>(input) + <usize>6 + <usize>out.data.length, load<u16>(changetype<usize>(input) + <usize>4 + <usize>out.data.length));
        return out;
    }
    return unreachable();
}
//@serializable
@json
class Position {
    name!: string;
    id!: i8;
    //pos!: Vec3;
    moving!: boolean;
    data!: Array<u8>;
}


const pos: Position = {
    name: "p1",
    id: 9,
    /*pos: {
        x: 3,
        y: 1,
        z: 8
    },*/
    moving: true,
    data: [1, 2, 3, 4, 5]
};

console.log(JSON.stringify(pos));

const serializedPos = TBS.serialize(pos);

console.log(Uint8Array.wrap(serializedPos).join(" "));

console.log(JSON.stringify(__TBS_Deserialize<Position>(TBS.serialize(pos), pos)))