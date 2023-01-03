//import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { TBS, string8 } from "./src/tbs";

@serializable
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
}

@serializable
class Position {
    name!: string;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<u32>;
}

const pos: Position = {
    name: "Markus Persson",
    id: 9,
    pos: {
        x: 3,
        y: 1,
        z: 8
    },
    moving: true,
    data: [1, 2, 3, 4, 5]
};

const serialized = TBS.serialize(pos);
console.log(Uint8Array.wrap(serialized).join(" "));

const parsed = TBS.parse<Position>(serialized);

console.log(JSON.stringify(parsed));