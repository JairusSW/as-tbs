import { Variant } from "as-variant";

const String16ID: u8 = 1;
const String8ID: u8 = 2;
const ArrayID: u8 = 3;
const i32ID: u8 = 4;
const i64ID: u8 = 5;
const f32ID: u8 = 6;
const f64ID: u8 = 7;

export type string8 = string;
export namespace TBS {
    // @ts-ignore
    @inline export function serialize<T>(data: T): ArrayBuffer {
        if (isString<T>()) {
            // UTF-16 String
            const out = new ArrayBuffer(((<string>data).length << 1) + 3);
            serializeTo(data, out);
            return out;
        } else if (isBoolean<T>()) {
            const out = new ArrayBuffer(1);
            serializeTo(data, out);
            return out;
        } else if (data instanceof i32) {
            const out = new ArrayBuffer(4);
            serializeTo(data, out);
            return out;
        } else if (data instanceof u32) {
            const out = new ArrayBuffer(4);
            serializeTo(data, out);
            return out;
        } else if (data instanceof i64) {
            const out = new ArrayBuffer(8);
            serializeTo(data, out);
            return out;
        } else if (data instanceof u64) {
            const out = new ArrayBuffer(8);
            serializeTo(data, out);
            return out;
        } else if (data instanceof f32) {
            const out = new ArrayBuffer(4);
            serializeTo(data, out);
            return out;
        } else if (data instanceof f64) {
            const out = new ArrayBuffer(8);
            serializeTo(data, out);
            return out;
            // @ts-ignore
        } else if (isDefined(data.__TBS_ByteLength)) {
            // @ts-ignore
            const out = new ArrayBuffer(data.__TBS_ByteLength());
            serializeTo(data, out);
            return out;
        }
        return unreachable();
    }
    /**
     * Serialize TBS-encoded data to a certain location and offset in memory.
     * Potentially unsafe as there is no bounds-checking within.
     * @param data Data to serialize
     * @param out ArrayBuffer to write to
     * @param offset Offset to write to
     * @returns void
     * @fail Does nothing on faliure
     */
    // @ts-ignore
    @inline export function serializeTo<T>(data: T, out: ArrayBuffer, offset: usize = 0): void {
        if (isString<T>()) {
            // UTF-16 String
            store<u8>(changetype<usize>(out) + offset, String16ID);
            store<u16>(changetype<usize>(out) + offset + <usize>1, (<string>data).length);
            memory.copy(changetype<usize>(out) + offset + <usize>3, changetype<usize>(data), (<string>data).length << 1);
        } else if (isBoolean<T>()) {
            store<bool>(changetype<usize>(out) + offset, <bool>data);
        } else if (data instanceof i32) {
            store<i32>(changetype<usize>(out) + offset, <i32>data);
        } else if (data instanceof u32) {
            store<i32>(changetype<usize>(out) + offset, <u32>data);
        } else if (data instanceof i64) {
            store<i64>(changetype<usize>(out) + offset, <i64>data);
        } else if (data instanceof u64) {
            store<u64>(changetype<usize>(out) + offset, <u64>data);
        } else if (data instanceof f32) {
            store<f32>(changetype<usize>(out) + offset, <f32>data);
        } else if (data instanceof f64) {
            store<f64>(changetype<usize>(out) + offset, <f64>data);
            // @ts-ignore
        } else if (data instanceof Array) {
            store<u8>(changetype<usize>(out) + offset, ArrayID);
            // @ts-ignore
            if (!(isManaged<valueof<T>>() || isReference<valueof<T>>())) {
                // Store type information but ignore for bool or null
                if (typeToID(data)) {
                    store<u8>(changetype<usize>(out) + offset + <usize>2, typeToID(data));
                    // Store the length
                    store<u16>(changetype<usize>(out) + offset + <usize>3, data.length);
                    // It is a primitive type
                    // @ts-ignore
                    memory.copy(changetype<usize>(out) + offset + <usize>5, data.buffer, data.length);
                }
            }
        } else if (isDefined(data.__TBS_ByteLength)) {
            // @ts-ignore
            data.__TBS_Serialize(data, out);
        }
    }
    // @ts-ignore
    @inline export function parse<T>(data: ArrayBuffer): T {
        if (isString<T>()) {
            const out = changetype<String>(__new((load<u16>(changetype<usize>(data) + <usize>1) >> 1), idof<String>()));
            parseTo(data, out);
            // @ts-ignore
            return out;
            // @ts-ignore
        } else if (isManaged<T>() || isReference<T>()) {
            // @ts-ignore
            const inst: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
            // @ts-ignore
            const out = inst.__TBS_Instantiate();
            //heap.free(changetype<usize>(inst));
            // @ts-ignore
            if (isDefined(out.__TBS_ByteLength)) {
                // @ts-ignore
                out.__TBS_Deserialize(data, out);
                return out;
            }
            return unreachable();
        } else if (idof<T>() == idof<Variant>()) {
            // @ts-ignore
            return parseArbitrary(data, load<u8>(changetype<usize>(data)));
        } else {
            return unreachable();
        }
    }
    /**
     * Deserialize TBS-encoded data from a certain location and offset in memory.
     * Potentially unsafe as there is no bounds-checking within.
     * @param data ArrayBuffer to deserialize
     * @param out Data structure to write to
     * @param offset Offset to read from
     * @returns void
     * @fail Does nothing on faliure
    */
    // @ts-ignore
    @inline export function parseTo<T>(data: ArrayBuffer, out: T, offset: usize = 0): void {
        if (isString<T>()) {
            memory.copy(changetype<usize>(out), changetype<usize>(data) + offset + <usize>3, (load<u16>(changetype<usize>(data) + offset + <usize>1) >> 1));
            // @ts-ignore
        } else if (isBoolean<T>()) {
            // @ts-ignore
            return load<boolean>(changetype<usize>(data));
        } else if (isInteger<T>() || isFloat<T>()) {
            switch (load<u8>(changetype<usize>(data))) {
                case i32ID: {
                    // @ts-ignore
                    return load<i32>(changetype<usize>(data) + offset + <usize>2);
                }
                case i64ID: {
                    // @ts-ignore
                    return load<i64>(changetype<usize>(data) + offset + <usize>2);
                }
                case f32ID: {
                    // @ts-ignore
                    return load<f32>(changetype<usize>(data) + offset + <usize>2);
                }
                case f64ID: {
                    // @ts-ignore
                    return load<f64>(changetype<usize>(data) + offset + <usize>2);
                }
            }
            // @ts-ignore
        } else if (isDefined(out.__TBS_ByteLength)) {
            // @ts-ignore
            out.__TBS_Deserialize(data, out);
        }
    }
}

// @ts-ignore
@inline function parseArbitrary(data: ArrayBuffer, type: u8, offset: usize = 0): Variant {
    switch (type) {
        case String16ID: {
            // @ts-ignore
            return Variant.from(parse<string>(data));
        } case String8ID: {
            // @ts-ignore
            return Variant.from(parse<string>(data));
        } case i32ID: {
            // @ts-ignore
            return Variant.from(parse<i32>(data));
        } case i64ID: {
            // @ts-ignore
            return Variant.from(parse<i64>(data));
        } case f32ID: {
            // @ts-ignore
            return Variant.from(parse<f32>(data));
        } case f64ID: {
            // @ts-ignore
            return Variant.from(parse<f64>(data));
        } case ArrayID: {
            const arrayType = load<i8>(changetype<usize>(data) + <usize>1);
            if (arrayType < 0) {
                // @ts-ignore
                return parseArbitrary(data, load<u8>(changetype<usize>(data) + <usize>1));
            } else {
                // Must either be nested array or object
                // @ts-ignore
                return parseArbitrary(data, load<u8>(changetype<usize>(data) + <usize>1));
            }
        }
    }
}

// @ts-ignore
@inline function typeToID<T>(data: T): u8 {
    if (isString<T>()) return String16ID;
    else if (data instanceof i32) return i32ID;
    else if (data instanceof i64) return i64ID;
    else if (data instanceof f32) return f32ID;
    else if (data instanceof f64) return f64ID;
    else if (data instanceof Array) return ArrayID;
    else return 0;
}