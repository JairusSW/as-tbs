Typed Binary Storage is a schema-centered serialization meant to enable the efficient transfer of primitive types and complex structures with minimal overhead. TBS only uses memory loads and stores and has no additional overhead when ser/de methods are generated. Additionally, it implements per-key modification without needing to parse the whole structure.

## Contents

💡[Motivation](#motivation)

🕵️‍♂️[Comparision](#comparision)

⏱️[Performance](#performance)

📦[Installation](#installation)

⚒️[Usage](#usage)

🧮[Implementations](#implementations)

📖[Documentation](#documentation)

## Motivation

TBS was created to have minimal overhead, individual key modification, and strong typing. I wanted something that is faster than Protobuf, incorporates individual key ser/de, and has a small footprint like Avro. TBS is a combination of the best serialization formats have to offer with performance and usability of utmost importance.

I also wanted TBS to be implemented in WebAssembly so that it can take advantage of the low-level memory control of WASM.

## Comparision

TBS is different than Avro as it allows the user to individually store data to a key's address without the need to parse. It also allows schemas to be misordered as they are sorted with the `djb2` hashing algorithm.

It is also different than Google's FlatBuffers because it does not panic due to a lack of bounds-checking.

Protobuf is perhaps the most similar, but TBS is usually slimmer and has less overhead due to its simplicity at runtime.

## Performance

I have not compared this yet.

The AssemblyScript implementation runs at approximately 310m ops/s when serializing a Vec3 and 351m when parsing both without allocations.

## Installation

TBD

## Usage

TBS

## Implementations

TBD
