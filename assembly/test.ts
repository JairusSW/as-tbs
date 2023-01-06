//import { TBS } from "./src/tbs";
import { JSON } from "json-as";
import { TBS, string8 } from "./src/tbs";

@serializable
class Vec3 {
    x!: i8;
    y!: i8;
    z!: i8;
    str!: string8;
}

@serializable
class Position {
    name!: string8;
    id!: i8;
    pos!: Vec3;
    moving!: boolean;
    data!: Array<f64>;
}

const pos: Position = {
    name: "p1",
    id: 9,
    pos: {
        x: 3,
        y: 1,
        z: 8,
        str: "hello"
    },
    moving: true,
    data: [1.8, 2.2, 3.5, 4.3, 5.9]
};

const serializedPosition = TBS.serialize(pos);
console.log(Uint8Array.wrap(serializedPosition).join(" "));

const parsedPosition = TBS.parse<Position>(serializedPosition);

console.log(Uint8Array.wrap(TBS.serialize(parsedPosition)).join(" "));

console.log(`TBS is ${serializedPosition.byteLength} bytes long\nJSON is ${JSON.stringify(parsedPosition).length} bytes long\nTBS is ${JSON.stringify(parsedPosition).length - serializedPosition.byteLength} bytes smaller than JSON.`);

/*console.log(`{
    name: "${parsedPosition.name}",
    id: ${parsedPosition.id},
    pos: {
        x: ${parsedPosition.pos.x},
        y: ${parsedPosition.pos.y},
        z: ${parsedPosition.pos.z},
        str: "${parsedPosition.pos.str}"
    }
}`);*/
console.log(JSON.stringify(parsedPosition));

const serializedVec3 = TBS.serialize(pos.pos);

console.log(Uint8Array.wrap(serializedVec3).join(" "));

const parsedVec3 = TBS.parse<Vec3>(serializedVec3);

console.log(JSON.stringify(parsedVec3));