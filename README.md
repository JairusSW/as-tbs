# TBS
**Typed Binary Storage is a schema-centered data ser/de format designed for maximum performance and absurd size.**

## About

**Performance**

*TBS is F-A-S-T. Here are some benchmarks taken with as-tral:*
```
Serialize Vec3: 78M ops/s

Deserialize Vec3: 84M ops/s
```

**Ser/de points**

TBS ser/de from and to a flat data structure.

No data manupulation is needed. Just check via the length that data exists and plug it in.

Encoded as a array of u8 bytes

**Size factors**

For Objects, TBS is 6.3x smaller than the corrosponding JSON.
```
JSON (19 length): {"x":3,"y":2,"z":8}

TBS (3 length): [3, 2, 8] (Binary, not text)
```
For Strings, it is the same length as JSON

For Arrays, it is 1 byte smaller than JSON (Unless it is a object)

For Numbers, it is 1 byte more than JSON (Because we have typing instead of no typing for JSON [JSON supports f64])

**How does this compare to Avro?**

It is similar to Avro, but it allows for schema-less parsing of arbitrary data. Especially useful for decoding data from a API which does not provide schema information or reading from a database without making a horrible schema. Also allows parsing non-object types as the base type.

I also have a more compact header that will take up less space and be compatible with streaming ser/de.

Another note, is that since it is length-prefixed, parsing is much faster.

**Ser/de details****

Unlike JSON where it is necessary to iterate over a string searching for tokens `"` `{` `}` `[` `]` `,` `1,2,3,4,5,6,7,8,9,0` along with the need to escape all escape codes, TBS requires no iterating because either the data is known beforehand (compile-time) or all sequences of bytes are length-prefixed and then parsed by their respective functions.
For example, to ser/de an object, we call:

```js
@tbs
class Vec3 {
  x!: i32;
  y!: i32;
  z!: i32;
  __TBS_Deserialize(buffer: ArrayBuffer): void {
    // Statements inside of block are auto-generated by transform
    this.x = load<i32>(changetype<usize>(buffer) + <usize>0);
    this.y = load<i32>(changetype<usize>(buffer) + <usize>4);
    this.z = load<i32>(changetype<usize>(buffer) + <usize>8);
  }
  __TBS_Serialize(): ArrayBuffer {
    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
    store<i32>(changetype<usize>(buffer) + <usize>0, this.x);
    store<i32>(changetype<usize>(buffer) + <usize>4, this.y);
    store<i32>(changetype<usize>(buffer) + <usize>8, this.z);
    return buffer;
  }
}
```

The functions are generated at COMPILE-TIME leaving us with a highly-performant method of ser/de

Strings and all arrays are quite similar. Example with the word "Hello"
```
[StringID, length, bytes]
[StringID, 5, 104, 101, 108, 108, 111]
```

Format spec (As of now)

Types
- Null = 0
- String = 1
- Array = 2
- Number = 3
- Object (If there is no prepended header type, then it is a Object.)
  
Null
[0]

Object
[value, value, value] (No type headers at all. Known before.)

String
[2, ...data]

Array
[3, type, ...data]

Number
[4, data]

Schemas

Schemas can be implemented in any way depending on the author of the lib. 
It uses a hash and then a sorting method to sort the keys so that order of the schema does not matter.

They contain the type, key, key position, and structure

Other types of data (non-object)
These are just se/de to their respective types.

TODO
- Move away from i32[]. ArrayBuffers instead
- Add support for all number types
- Discuss transferring schema patterns from one location to another. (Up to the developer or use some header?)
- Possibly omit all typing? Designated by the schema
- Add validiy checking