import { Variant } from "as-variant/assembly";

export type string8 = string;
export namespace TBS {
    export enum Types {
        u8 = 1,
        i8 = 2,
        u16 = 3,
        i16 = 4,
        u32 = 5,
        i32 = 6,
        u64 = 7,
        i64 = 8,
        f32 = 9,
        f64 = 10,
        StringU8 = 11,
        StringU16 = 12,
        Struct = 13
    }
    export enum ComplexTypes {
        // Array Types
        // For integers, we include a sign bit because we want to support arbitrary ser/de.
        ArrayU8 = 15,
        ArrayI8 = 16,
        ArrayU16 = 17,
        ArrayI16 = 18,
        ArrayU32 = 19,
        ArrayI32 = 20,
        ArrayU64 = 21,
        ArrayI64 = 22,
        ArrayBool = 23,
        ArrayStringU8 = 24,
        ArrayStringU16 = 25,

        // Dimensional Arrays
        ArrayDim = 26,
        ArrayDimU8 = 27,
        ArrayDimI8 = 28,
        ArrayDimU16 = 29,
        ArrayDimI16 = 30,
        ArrayDimU32 = 31,
        ArrayDimI32 = 32,
        ArrayDimU64 = 33,
        ArrayDimI64 = 34,
        ArrayDimBool = 35,
        ArrayDimStringU8 = 36,
        ArrayDimStringU16 = 37
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
        } else if (isArray<T>()) {
            // @ts-ignore
            const out = new ArrayBuffer(data.length + 1);
            // @ts-ignore
            serializeTo(data, out);
            // @ts-ignore
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
            //store<u8>(changetype<usize>(out) + offset, Types.Array);
            // @ts-ignore
            if (isString<valueof<T>>()) {
                store<u8>(changetype<usize>(out) + offset, ComplexTypes.ArrayStringU8);
                memory.copy(changetype<usize>(out) + <usize>1 + offset, changetype<usize>(data), data.length);
                // @ts-ignore
            } else if (isArray<valueof<T>>()) {
                // @ts-ignore
                const type = changetype<valueof<valueof<T>>>();
                if (type instanceof u8) {
                    store<u8>(changetype<usize>(out) + offset, ComplexTypes.ArrayDimU8);
                    store<u8>(changetype<usize>(out) + <usize>1 + offset, 2);
                    memory.copy(changetype<usize>(out) + <usize>2 + offset, changetype<usize>(data), data.length);
                }
                // TODO: Get depth of array
            }
            // @ts-ignore
            const deepType: valueof<T> = (isManaged<valueof<T>>() || isReference<valueof<T>>()) ? changetype<valueof<T>>(0) : 0;
            if (deepType instanceof u8) {
                store<u8>(changetype<usize>(out) + offset, ComplexTypes.ArrayU8);
                // @ts-ignore
                memory.copy(changetype<usize>(out) + <usize>1 + offset, changetype<usize>(data.buffer), data.length);
            }
            /*// @ts-ignore
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
            }*/
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
        } else if (isArray<T>()) {
            // @ts-ignore
            const deepType: valueof<T> = (isManaged<valueof<T>>() || isReference<valueof<T>>()) ? changetype<valueof<T>>(0) : 0;
            if (deepType instanceof u8) {
                const out = new Array<u8>(data.byteLength - 1);
                parseTo<u8[]>(data, out);
                // @ts-ignore
                return out;
            }
        } else if (isManaged<T>() || isReference<T>()) {
            if (idof<T>() == idof<Variant>()) {
                // @ts-ignore
                return parseArbitrary(data, load<u8>(changetype<usize>(data)));
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
        } else if (isArray<T>()) {
            // @ts-ignore
            const deepType: valueof<T> = (isManaged<valueof<T>>() || isReference<valueof<T>>()) ? changetype<valueof<T>>(0) : 0;
            if (deepType instanceof u8) {
                // @ts-ignore
                memory.copy(changetype<usize>(out.buffer), changetype<usize>(data) + offset + <usize>1, data.byteLength);
                return;
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
        } case TBS.ComplexTypes.ArrayU8: {
            // @ts-ignore
            return Variant.from<u8[]>(TBS.parse<u8[]>(data));
        }
        default: {
            return unreachable();
        }
    }
}
/*
// @ts-ignore
@inline function typeToID<T>(data: T): u8 {
    if (isString<T>()) return TBS.Types.StringU16;
    else if (data instanceof i32) return TBS.Types.i32;
    else if (data instanceof i64) return TBS.Types.i64;
    else if (data instanceof f32) return TBS.Types.f32;
    else if (data instanceof f64) return TBS.Types.f64;
    else if (data instanceof Array) return TBS.Types.Array;
    else return 0;
}*/