# TBS
![AssemblyScript](https://img.shields.io/badge/AssemblyScript-blue)
![WebAssembly](https://img.shields.io/badge/WebAssemby-purple)

Typed Binary Storage, also known as TBS is a schema-centered serialization format meant for the efficient and performant ser/de of data into a binary form. Designed for minimal if no overhead, TBS should be only memory loads and stores after the ser/de methods are generated. It also implements per-key ser/de without the need to parse first such as in JSON allowing fast mangling such as in Google's FlatBuffers.

**TBS is in development. Expect breaking changes at a minimum along with many more features and updates for the next month or so when a stable version will be released**

**You can read a little about it on the WIP GitBook https://jtanaka.gitbook.io/tbs/**

## Contents

- [Purpose](#purpose)
- [Setup](#setup)
- [Usage](#usage)
- [Design](#design)

## Purpose

TBS was made to enable the performant transfer of basic data types across i/o with minimal overhead and memory usage. The format is inspired by [Apache Avro](https://avro.apache.org/) and meant to provide both the ability to modify keys induvidually and support arbitrary ser/de. 

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
  // Type string is UTF-16 encoded
  pos!: Vec3;
  moving!: boolean;
  data!: Array<u8>;
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

const serialized = TBS.serialize<Position>(pos);
// This prints the binary data
// console.log(Uint8Array.wrap(serialized).join(" "));
const parsed = TBS.parse<Position>(serialized);
// Maybe add this to visualize data?
// import { JSON } from "json-as/assembly";
// console.log(JSON.stringify(parsed));
```

## Design

Many serialization formats require the user to iterate over the binary data searching for tokens and then splitting where needed. TBS avoids this overhead by knowing where data segments start and end and length-prefixing data of a specific length. Because of this design, encoding and decoding is simply a series of `load` and `store` operations to and from a segment of memory.

Keys are 
## Benchmark

`Serialize Vec3: 83m ops/s`
and
`Deserialize Vec3: 84m ops/s`

Without allocating new objects, this averages about `300m ops/s` both ways.