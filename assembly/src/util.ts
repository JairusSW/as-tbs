// @ts-ignore
@inline export function unsafeCharCodeAt(data: string, pos: i32): i32 {
    return load<u16>(changetype<usize>(data) + ((<usize>pos) << 1));
}

export function djb2(data: string): i32 {
    let hash = 5381;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + unsafeCharCodeAt(data, i)) & 0xFFFFFFFF;
    }
    return hash;
}

/** Reads an unsigned integer from memory. */
export function readUint<T>(offet: usize = 0): u32 {
    var pos = offet;
    var val = <u32>load<T>(pos);
    offet = pos + sizeof<T>();
    return val;
}

/** Reads an unsigned 64-bit integer from memory. */
export function readUint64(offset: usize = 0): u64 {
    var pos = offset;
    var val = load<u64>(pos);
    offset = pos + 8;
    return val;
}

/** Reads a LEB128-encoded unsigned integer from memory. */
export function readVaruint(size: u32, offset: usize = 0): u32 {
  var val: u32 = 0;
  var shl: u32 = 0;
  var byt: u32;
  var pos = offset;
  do {
    byt = load<u8>(pos++);
    val |= (byt & 0x7F) << shl;
    if (!(byt & 0x80)) break;
    shl += 7;
  } while (true);
  offset = pos;
  return val;
}


/** Reads a LEB128-encoded signed integer from memory. */
export function readVarint(size: u32, offset: usize = 0): i32 {
  var val: u32 = 0;
  var shl: u32 = 0;
  var byt: u32;
  var pos = offset;
  do {
    byt = load<u8>(pos++);
    val |= (byt & 0x7F) << shl;
    shl += 7;
  } while (byt & 0x80);
  offset = pos;
  return select<u32>(val | (~0 << shl), val, shl < size && (byt & 0x40) != 0);
}


/** Reads a LEB128-encoded signed 64-bit integer from memory. */
export function readVarint64(offset: usize = 0): i64 {
  var val: u64 = 0;
  var shl: u64 = 0;
  var byt: u64;
  var pos = offset;
  do {
    byt = load<u8>(pos++);
    val |= (byt & 0x7F) << shl;
    shl += 7;
  } while (byt & 0x80);
  offset = pos;
  return select<u64>(val | (~0 << shl), val, shl < 64 && (byt & 0x40) != 0);
}

/**
 * A terrible function which finds the depth of a certain array.
 * Suffers no overhead besides function calling and a if/else.
 * @returns depth of array
 */
export function getArrayDepth<T>(depth: i32 = 1): i32 {
  // @ts-ignore
  if (isArray<valueof<T>>()) {
    depth++;
    // @ts-ignore
    return getArrayDepth<valueof<T>>(depth);
  } else {
    return depth;
  }
}