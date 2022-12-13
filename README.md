Typed Binary Storage is a schema-oriented data ser/de format designed for maximum performance and absurd size.

Speed? F-A-S-T

Serialize Vec3: 27,777,778 ops/s

Deserialize Vec3: 23,474,178 ops/s

How compact is TBS?

For Objects, TBS is 4.75x smaller than the corrosponding JSON.

JSON (19 length): {"x":3,"y":2,"z":8}

TBS (4 length): [1, 3, 2, 8] (Binary, not text)

How does this compare to Avro?

It is one byte larger than Avro, but it allows for schema-less parsing of arbitrary data. Especially useful for decoding data from a API which does not provide schema information or reading from a database without making a horrible schema. Also allows parsing non-object types as the base type.

Ser/de details

Unlike JSON where it is necessary to iterate over a string searching for tokens `"` `{` `}` `[` `]` `,` `1,2,3,4,5,6,7,8,9,0` along with the need to escape all escape codes, TBS requires no iterating because either the data is known beforehand (compile-time) or all sequences of bytes are length-prefixed and then parsed by their respective functions.
For example, to ser/de an object, we call:

```js
class Vec3 {
  x!: i32;
  y!: i32;
  z!: i32;
  __TBS_Deserialize(data: Array<i32>): void {
    this.x = unchecked(data[1]);
    this.y = unchecked(data[2]);
    this.z = unchecked(data[3]);
  }
  __TBS_Serialize(): Array<i32> {
    return [1, this.x, this.y, this.z];
  }
}
```

The functions are generated at COMPILE-TIME leaving us with a highly-performant method of ser/de

Strings and all arrays are quite similar. Example with the word "Hello"
```
[StringID, length, bytes]
[StringID, 5, 104, 101, 108, 108, 111]
```

To parse, we use something like so:

```js
function parse<T>(data: i32[]): T {
    if (data[0] == StringID/*Even better, use isString<T>()*/) {
        // data[1] is the length
        return String.UTF8.decode(data.slice(2, data[1]).buffer);
    }
}

Format spec (As of now)

Types
- Null = 0
- Object = 1
- String = 2
- Array = 3
- Number = 4
  
Null
[0]

Object
[1, value, value, value]

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