# TBS
![AssemblyScript](https://img.shields.io/badge/AssemblyScript-blue)
![WebAssembly](https://img.shields.io/badge/WebAssemby-purple)

Typed Binary Storage is a schema-centered data ser/de format optimized for performance and minisceule size. It is designed to be compatible with most languages, but with WebAssembly in mind. By design, TBS is made so that little or no computation is required to ser/de any TBS-encoded data and so there is little overhead involved. Because of this, performance is extrodinary by default.

**TBS is in development. Expect breaking changes at a minimum along with many more features and updates for the next month or so when a stable version will be released**

## Contents

- [Purpose](#purpose)
- [Setup](#setup)
- [Usage](#usage)
- [Specification](#specification)

## Purpose

TBS was made to enable the performant transfer of basic data types across i/o with minimal overhead and memory usage. The format is inspired by [Apache Avro](https://avro.apache.org/).
TODO: make this tl;dr

## Setup

```bash
~ npm install JairusSW/as-tbs
```

Add the transform to your `asc` command

```bash
--transform as-tbs/transform
```

Or, add it to `asconfig.json`

```
{
  "options": {
    "transform": ["as-tbs/transform"]
  }
}
```

## Usage

```js
import { TBS, string8 } from "as-tbs/assembly";
//            ^ UTF-8 string type

// If you add JSON, don't add the @json decorator. @serializable works here.
@serializable
class Vec3 {
  x!: i8;
  y!: i8;
  z!: i8;
}

@serializable
class Position {
  name: string8;
  id: i8;
  // Will be encoded/decoded as a UTF-8 string.
  // UTF-16 support will land soon.
  pos!: Vec3;
}

const pos: Position = {
  name: "Markus Persson",
  id: 9,
  pos: {
    x: 3,
    y: 1,
    z: 8
  }
};

const serialized = TBS.serialize<Position>(pos);
// This prints the binary data
// console.log(Uint8Array.wrap(serialized).join(" "));
const parsed = TBS.parse<Position>(serialized);
// Maybe add this to visualize data?
// import { JSON } from "json-as/assembly";
// console.log(JSON.stringify(parsed));
```

## Specification

Only object ser/de is implemented at the moment. You will be able to ser/de all valid types which is (Object/Struct, String16, String8, Array<T>, bool, i8-64, f32, f64, u8-64).

Serializing the data `{"name":"Markus Persson","id":9,"pos":{"x":3,"y":1,"z":8}}` results in the TBS-encoded data,
`14 77 97 114 107 117 115 32 80 101 114 115 115 111 110 9 3 1 8`

Here's a breakdown.

`14`: length of string

`77-110`: UTF-8 encoded string data

`9`: id value

`3`: pos.x value

`1`: pos.y value

`8`: pos.z value

## Benchmark

Didn't take benches recently, but ser/de takes:

`Serialize Vec3: 83m ops/s`
and
`Deserialize Vec3: 84m ops/s`

Without allocating new objects, this averages about `300m ops/s`.