Typed Binary Storage is a schema-oriented data ser/de format designed for maximum performance and absurd size.

How compact is TBS?

For Objects, TBS is 4.75x smaller than the corrosponding JSON.

JSON (19 length): {"x":3,"y":2,"z":8}

TBS (4 length): [1, 3, 2, 8] (Binary, not text)

Speed? Unoptimized at this point. Uses arrays which are slow.

Benches for 5,000,000 ops

Serialize Vec3: 638ms (~7m ops/s)

Deserialize Vec3: 281ms (~19m ops/s)

How does this compare to Avro?

It is one byte larger than Avro, but it allows for schema-less parsing of arbitrary data. Especially useful for decoding data from a API which does not provide schema information or reading from a database without making a horrible schema.

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