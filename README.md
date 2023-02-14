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

## Benchmarks

Benchmarks are taken with as-tral and results are located in [benchmark-results.txt](https://github.com/JairusSW/as-tbs/blob/master/benchmark-results.txt)

## Purpose

TBS was made to enable the performant transfer of basic data types across i/o with minimal overhead and memory usage. The format is inspired by [Apache Avro](https://avro.apache.org/) and meant to provide both the ability to modify keys induvidually and support arbitrary ser/de. 

## Setup (Not ready for general use!)

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

## Format

#### Structures

Structures are a data type where the data types and keys are known beforehand. Every key and its corrosponding type is in the schema and only the values are serialized and deserialized resulting in a compact form. This should be the default way that data is transferred if possible because of its performance and size benefits.

**Example of Vec3 ser/de**

Data structure
```
{
  x: i8 = 1
  y: i8 = 2
  z: i8 = 3
}
```

Serializes to:

`[1, 2, 3]`

Now, when we have more complex structures such as strings and arrays, we make sure to length-prefix our arrays.

Data structure
```
{
  pos: i8[] = [1, 2, 3]
}
```

Serializes to:

`[3, 0, 1, 2, 3]`

Notice the leading `3` is the length of the array containing two bytes of data with a maximum length of 65,536. Formatted in big-endian.

With strings, it is the same, but the user can choose between UTF8 and UTF16 strings.

Data structure
```
{
  name: string8 = "Jairus Tanaka"
  // UTF-8 string
}
```

Serializes to:

`[13, 0, 74, 97, 105, 114, 117, 115, 32, 84, 97, 110, 97, 107, 97]`

For complex data structures, it looks like so

```
{
  name: "pos",
  id: 3,
  pos: {
    x: i8 = 1
    y: i8 = 2
    z: i8 = 3
  }
}
```

Serializes to:

```
[112, 111, 115, 3, 1, 2, 3]
"p    o    s"  id  x  y  z
```

#### Arbitrary values

TBS supports the following types

- String16
- String8
- Boolean
- i8/u8
- i16/u16
- i32/u32
- i64/u64
- f32
- f64
- Array
- Structure

String16
[length hi, length low, ...char]
Note: Length is not the byte length, but the length of characters. In other words, bytelength / 2

String8
[length hi, length low, ...char]

Boolean (1 byte)
(false) 0b0000000
(true) 0b11111111

i8/u8

Single byte of data. 2s complement for negative numbers

0b_ _ _ _ _ _ _ _

i16/u16

