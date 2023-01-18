import { Variant } from "as-variant/assembly";

export type string8 = string;
export namespace TBS {
    export enum Types {
        u8 = 0b0001,
        i8 = 0b1001,
        u16 = 0b0010,
        i16 = 0b1010,
        u32 = 0b0011,
        i32 = 0b1011,
        u64 = 0b0100,
        i64 = 0b1100,
        f32 = 0b1101,
        f64 = 0b0110,
        StringU8 = 0b0111,
        StringU16 = 0b1000,
        Array = 0b1110,
        Struct = 0b1111
    }
    export enum ComplexTypes {
        // Array Types
        // For integers, we include a sign bit because we want to support arbitrary ser/de.
        ArrayU8 = 0b00010001,
        // 0001
        ArrayI8 = 0b00011001,
        // 1001
        ArrayU16 = 0b00010010,
        // 0010
        ArrayI16 = 0b00010010,
        // 1010
        ArrayU32 = 0b00010011,
        // 0011
        ArrayI32 = 0b00011011,
        // 1011
        ArrayU64 = 0b00010100,
        // 0100
        ArrayI64 = 0b00011100,
        // 1100
        ArrayBool = 0b00011111
        // 1111
    }
    // @ts-ignore
    @inline export function serialize<T>(data: T): ArrayBuffer {
        if (isString<T>()) {
            // UTF-16 String
            const out = new ArrayBuffer(((<string>data).length << 1) + 1);
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
        } else if (isDefined(__TBS_Serialize)) {
            // @ts-ignore
            const out = new ArrayBuffer(3);
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
            store<u8>(changetype<usize>(out) + offset, Types.StringU8);
            memory.copy(changetype<usize>(out) + offset + <usize>1, changetype<usize>(data), (<string>data).length << 1);
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
            store<u8>(changetype<usize>(out) + offset, Types.Array);
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
            // @ts-ignore
        } else if (isDefined(__TBS_Serialize)) {
            // @ts-ignore
            __TBS_Serialize(data, out);
        }
    }
    // @ts-ignore
    @inline export function parse<T>(data: ArrayBuffer): T {
        if (isString<T>()) {
            // @ts-ignore
            const out = changetype<String>(__new(data.byteLength - 1, idof<String>()));
            parseTo(data, out);
            // @ts-ignore
            return out;
            // @ts-ignore
        } else if (isManaged<T>() || isReference<T>()) {
            if (idof<T>() == idof<Variant>()) {
                // @ts-ignore
                return parseArbitrary(data, Types.StringU16);
            }
            // @ts-ignore
            const inst: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
            // @ts-ignore
            const out = inst.__TBS_Instantiate();
            //heap.free(changetype<usize>(inst));
            // @ts-ignore
            if (isDefined(__TBS_Deserialize)) {
                // @ts-ignore
                __TBS_Deserialize(data, out);
                return out;
            }
            return unreachable();
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
            memory.copy(changetype<usize>(out), changetype<usize>(data) + offset + <usize>1, data.byteLength - 1);
            // @ts-ignore
        } else if (isBoolean<T>()) {
            // @ts-ignore
            return load<boolean>(changetype<usize>(data));
        } else if (isInteger<T>() || isFloat<T>()) {
            switch (load<u8>(changetype<usize>(data))) {
                case Types.i32: {
                    // @ts-ignore
                    return load<i32>(changetype<usize>(data) + offset + <usize>2);
                }
                case Types.i64: {
                    // @ts-ignore
                    return load<i64>(changetype<usize>(data) + offset + <usize>2);
                }
                case Types.f32: {
                    // @ts-ignore
                    return load<f32>(changetype<usize>(data) + offset + <usize>2);
                }
                case Types.f64: {
                    // @ts-ignore
                    return load<f64>(changetype<usize>(data) + offset + <usize>2);
                }
            }
            // @ts-ignore
        } else if (isDefined(__TBS_Deserialize)) {
            // @ts-ignore
            __TBS_Deserialize(data, out);
        }
    }
}

// @ts-ignore
function parseArbitrary(data: ArrayBuffer, type: i32): Variant {
    switch (type) {
        case TBS.Types.StringU8: {
            // @ts-ignore
            return Variant.from<string>(TBS.parse<string>(data));
        } case TBS.Types.StringU16: {
            // @ts-ignore
            return Variant.from<string>(TBS.parse<string>(data));
        } case TBS.Types.u8: {
            // @ts-ignore
            return Variant.from<u8>(TBS.parse<u8>(data));
        } case TBS.Types.i8: {
            // @ts-ignore
            return Variant.from<i8>(TBS.parse<i8>(data));
        } case TBS.Types.u16: {
            // @ts-ignore
            return Variant.from<u16>(TBS.parse<u16>(data));
        } case TBS.Types.i16: {
            // @ts-ignore
            return Variant.from<i16>(TBS.parse<i16>(data));
        } case TBS.Types.u32: {
            // @ts-ignore
            return Variant.from<u32>(TBS.parse<u32>(data));
        } case TBS.Types.i32: {
            // @ts-ignore
            return Variant.from<i32>(TBS.parse<i32>(data));
        } case TBS.Types.u64: {
            // @ts-ignore
            return Variant.from<u64>(TBS.parse<u64>(data));
        } case TBS.Types.i64: {
            // @ts-ignore
            return Variant.from<i64>(TBS.parse<i64>(data));
        } case TBS.Types.f32: {
            // @ts-ignore
            return Variant.from<f32>(TBS.parse<f32>(data));
        } case TBS.Types.f64: {
            // @ts-ignore
            return Variant.from<f64>(TBS.parse<f64>(data));
        } case TBS.Types.Array: {
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
        default: {
            return unreachable();
        }
    }
}

// @ts-ignore
@inline function typeToID<T>(data: T): u8 {
    if (isString<T>()) return TBS.Types.StringU16;
    else if (data instanceof i32) return TBS.Types.i32;
    else if (data instanceof i64) return TBS.Types.i64;
    else if (data instanceof f32) return TBS.Types.f32;
    else if (data instanceof f64) return TBS.Types.f64;
    else if (data instanceof Array) return TBS.Types.Array;
    else return 0;
}