Typed Binary Storage is a schema-oriented data ser/de format designed for maximum performance and absurd size

Format (As of now)

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