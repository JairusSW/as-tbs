import { Variant } from "as-variant/assembly";
import { getArrayDepth } from "./util";
import { JSON } from "json-as";

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
        ArrayU8 = 14,
        ArrayI8 = 15,
        ArrayU16 = 16,
        ArrayI16 = 17,
        ArrayU32 = 18,
        ArrayI32 = 19,
        ArrayU64 = 20,
        ArrayI64 = 21,
        ArrayF32 = 22,
        ArrayF64 = 23,
        ArrayBool = 24,
        ArrayStringU8 = 25,
        ArrayStringU16 = 26,
        ArrayStruct = 27,

        // Dimensional Arrays
        ArrayDim = 28,
        ArrayDimU8 = 29,
        ArrayDimI8 = 30,
        ArrayDimU16 = 31,
        ArrayDimI16 = 32,
        ArrayDimU32 = 33,
        ArrayDimI32 = 34,
        ArrayDimU64 = 35,
        ArrayDimI64 = 36,
        ArrayDimF32 = 37,
        ArrayDimF64 = 38,
        ArrayDimBool = 39,
        ArrayDimStringU8 = 40,
        ArrayDimStringU16 = 41,
        ArrayDimStruct = 42
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
        } else if (data instanceof i8 || data instanceof u8) {
            const out = new ArrayBuffer(1);
            serializeTo(data, out);
            return out;
        } else if (data instanceof i16 || data instanceof u16) {
            const out = new ArrayBuffer(2);
            serializeTo(data, out);
            return out;
        } else if (data instanceof i32 || data instanceof u32) {
            const out = new ArrayBuffer(4);
            serializeTo(data, out);
            return out;
        } else if (data instanceof i64 || data instanceof I64 || data instanceof u64 || data instanceof U64) {
            const out = new ArrayBuffer(8);
            serializeTo(data, out);
            return out;
        } else if (data instanceof f32 || data instanceof F32) {
            const out = new ArrayBuffer(4);
            serializeTo(data, out);
            return out;
        } else if (data instanceof f64 || data instanceof F64) {
            const out = new ArrayBuffer(8);
            serializeTo(data, out);
            return out;
            // @ts-ignore
        } else if (isArray<T>()) {
            // @ts-ignore
            const out = isArray<valueof<T>>() ? new ArrayBuffer(byteLength(data)) : new ArrayBuffer(data.length + 1);
            // @ts-ignore
            serializeTo(data, out);
            // @ts-ignore
            return out;
            // @ts-ignore
        } else if (isDefined(data.__TBS_Serialize)) {
            // @ts-ignore
            const out = new ArrayBuffer(byteLength(data));
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
            //memory.copy(changetype<usize>(out) + offset + <usize>1, changetype<usize>(data), (<string>data).length << 1);
            store<ArrayBuffer>(changetype<usize>(out) + 1, changetype<ArrayBuffer>(data));
        } else if (isBoolean<T>()) {
            store<bool>(changetype<usize>(out) + offset, <bool>data);
        } else if (data instanceof u8) {
            store<u8>(changetype<usize>(out) + offset, <u8>data);
        } else if (data instanceof i8) {
            store<i8>(changetype<usize>(out) + offset, <i8>data);
        } else if (data instanceof u16) {
            store<u16>(changetype<usize>(out) + offset, <u16>data);
        } else if (data instanceof i16) {
            store<i16>(changetype<usize>(out) + offset, <i16>data);
        } else if (data instanceof u32) {
            store<u32>(changetype<usize>(out) + offset, <u32>data);
        } else if (data instanceof i32) {
            store<i32>(changetype<usize>(out) + offset, <i32>data);
        } else if (data instanceof u64) {
            store<u64>(changetype<usize>(out) + offset, <u64>data);
        } else if (data instanceof i64) {
            store<i64>(changetype<usize>(out) + offset, <i64>data);
        } else if (data instanceof f32) {
            store<f32>(changetype<usize>(out) + offset, <f32>data);
        } else if (data instanceof f64) {
            store<f64>(changetype<usize>(out) + offset, <f64>data);
            // @ts-ignore
        } else if (data instanceof Array) {
            // @ts-ignore
            if (isArray<valueof<T>>()) {
                serializeDeepArray(data, out);
            }
            // @ts-ignore
        } else if (isDefined(data.__TBS_Serialize)) {
            // @ts-ignore
            data.__TBS_Serialize(data, out);
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
            return unreachable();
        } else if (isManaged<T>() || isReference<T>()) {
            if (idof<T>() == idof<Variant>()) {
                // @ts-ignore
                return parseArbitrary(data, load<u8>(changetype<usize>(data)));
            }
            // @ts-ignore
            const out: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
            // @ts-ignore
            //const out = inst.__TBS_Instantiate();
            //heap.free(changetype<usize>(inst));
            // @ts-ignore
            if (isDefined(out.__TBS_Deserialize)) {
                // @ts-ignore
                out.__TBS_Deserialize(data, out);
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
            // @ts-ignore
            const type: T = 0;
            if (type instanceof u8) {
                // @ts-ignore
                return load<u8>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof i8) {
                // @ts-ignore
                return load<i8>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof u8) {
                // @ts-ignore
                return load<u8>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof u16) {
                // @ts-ignore
                return load<u16>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof i16) {
                // @ts-ignore
                return load<i16>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof u32) {
                // @ts-ignore
                return load<u32>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof i32) {
                // @ts-ignore
                return load<i32>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof f32) {
                // @ts-ignore
                return load<f32>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof u64) {
                // @ts-ignore
                return load<u64>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof i64) {
                // @ts-ignore
                return load<i64>(changetype<usize>(data) + offset + <usize>1);
            } else if (type instanceof f64) {
                // @ts-ignore
                return load<f64>(changetype<usize>(data) + offset + <usize>1);
            }
        } else if (isArray<T>()) {
            // @ts-ignore
            const deepType: valueof<T> = (isManaged<valueof<T>>() || isReference<valueof<T>>()) ? changetype<valueof<T>>(0) : 0;
            if (deepType instanceof u8 || deepType instanceof i8) {
                // @ts-ignore
                memory.copy(changetype<usize>(out.buffer), changetype<usize>(data) + offset + <usize>1, data.byteLength - 1);
                return;
            } else if (deepType instanceof u16 || deepType instanceof i16) {
                // @ts-ignore
                memory.copy(changetype<usize>(out.buffer), changetype<usize>(data) + offset + <usize>1, (data.byteLength - 1) << 1);
                return;
            } else if (deepType instanceof u32 || deepType instanceof i32 || deepType instanceof f32) {
                // @ts-ignore
                memory.copy(changetype<usize>(out.buffer), changetype<usize>(data) + offset + <usize>1, (data.byteLength - 1) << 2);
                return;
            } else if (deepType instanceof u64 || deepType instanceof i64 || deepType instanceof f64) {
                // @ts-ignore
                memory.copy(changetype<usize>(out.buffer), changetype<usize>(data) + offset + <usize>1, (data.byteLength - 1) << 3);
                return;
            }
            // @ts-ignore
        } else if (isDefined(out.__TBS_Deserialize)) {
            // @ts-ignore
            out.__TBS_Deserialize(data, out);
        }
    }
    @inline export function byteLength<T>(data: T): i32 {
        
        if (isDefined(data.__TBS_ByteLength)) {
            return data.__TBS_ByteLength;
        } else if (data instanceof Array) {
            arrByteLen = 0;
            arrayByteLength(data);
            return arrByteLen;
        }
        return unreachable();
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
        } case TBS.ComplexTypes.ArrayU8: {
            // @ts-ignore
            return Variant.from<u8[]>(TBS.parse<u8[]>(data));
        } case TBS.ComplexTypes.ArrayI8: {
            // @ts-ignore
            return Variant.from<i8[]>(TBS.parse<i8[]>(data));
        } case TBS.ComplexTypes.ArrayU16: {
            // @ts-ignore
            return Variant.from<u16[]>(TBS.parse<u16[]>(data));
        } case TBS.ComplexTypes.ArrayI16: {
            // @ts-ignore
            return Variant.from<i16[]>(TBS.parse<i16[]>(data));
        } case TBS.ComplexTypes.ArrayU32: {
            // @ts-ignore
            return Variant.from<u32[]>(TBS.parse<u32[]>(data));
        } case TBS.ComplexTypes.ArrayI32: {
            // @ts-ignore
            return Variant.from<i32[]>(TBS.parse<i32[]>(data));
        } case TBS.ComplexTypes.ArrayU64: {
            // @ts-ignore
            return Variant.from<u64[]>(TBS.parse<u64[]>(data));
        } case TBS.ComplexTypes.ArrayI64: {
            // @ts-ignore
            return Variant.from<i64[]>(TBS.parse<i64[]>(data));
        } case TBS.ComplexTypes.ArrayF32: {
            // @ts-ignore
            return Variant.from<f32[]>(TBS.parse<f32[]>(data));
        } case TBS.ComplexTypes.ArrayF64: {
            // @ts-ignore
            return Variant.from<f64[]>(TBS.parse<f64[]>(data));
        }
    }
    if (data.byteLength == 1) {
        return Variant.from<i8>(load<i8>(changetype<usize>(data)));
    } else if (data.byteLength == 2) {
        return Variant.from<i16>(load<i16>(changetype<usize>(data)));
    } else if (data.byteLength == 4) {
        return Variant.from<i32>(load<i32>(changetype<usize>(data)));
    } else if (data.byteLength == 8) {
        return Variant.from<i64>(load<i64>(changetype<usize>(data)));
    }
    return unreachable();
}

// @ts-ignore
@inline export function serializeDeepArray<T extends Array<any>>(data: T, out: ArrayBuffer, depth: usize = 1, offset: i32 = 0): void {
    if (isArray<valueof<valueof<T>>>()) {
        serializeDeepArray<valueof<T>>(data[0], out, ++depth);
    } else {
        const type: valueof<valueof<T>> = (isManaged<valueof<valueof<T>>>() || isReference<valueof<valueof<T>>>()) ? changetype<valueof<valueof<T>>>(0) : 0;
        // @ts-ignore
        if (type instanceof u8 || type instanceof i8) {
            store<u8>(changetype<usize>(out), TBS.ComplexTypes.ArrayDimU8);
            store<u8>(changetype<usize>(out) + <usize>1 + offset, depth);
            store<u16>(changetype<usize>(out) + <usize>2 + offset, TBS.byteLength(data))
            for (let i = 0; i < data.length; i++) {
                const arr = unchecked(data[i]);
                store<u16>(changetype<usize>(out) + <usize>4 + offset, arr.length);
                memory.copy(changetype<usize>(out) + <usize>6 + offset, arr.dataStart, arr.length);
                offset += arr.byteLength + 2;
            }
        }
    }
}

// @ts-ignore
@lazy let arrByteLen = 0;
// @ts-ignore
@inline export function arrayByteLength<T extends Array<any>>(data: T): void {
    // @ts-ignore
    if (isArray<valueof<valueof<T>>>()) {
        arrayByteLength<valueof<T>>(data[0]);
    } else {
        arrByteLen = (data.length + 2) << 1;
        for (let i = 0; i < data.length; ++i) {
            let child = load<usize>(data.dataStart + (i << alignof<T>()));
            arrByteLen += child == 0 ? 0 : load<i32>(child, offsetof<T>("length_"));
        }
    }
}