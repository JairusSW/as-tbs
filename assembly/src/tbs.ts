import { Variant } from "as-variant/assembly";

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
        Struct = 13,
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
    @inline export function serialize<T>(data: T, buffer: ArrayBuffer | null = null, offset: i32 = 0): ArrayBuffer {
        if (isString<T>()) {
            // UTF-16 String
            const out = buffer ? buffer : new ArrayBuffer(((<string>data).length << 1) + 1);
            // UTF-16 String
            store<u8>(changetype<usize>(out) + offset, Types.StringU16);
            memory.copy(changetype<usize>(out) + offset + <usize>1, changetype<usize>(data), (<string>data).length << 1);
            return out;
        } else if (isArray<T>()) {
            // @ts-ignore
            const out = buffer ? buffer : (isArray<valueof<T>>() ? new ArrayBuffer(sizeOf(data)) : new ArrayBuffer((data.buffer.byteLength)));
            //store<u8>(changetype<usize>(out) + offset, typeToID<T>());
            // @ts-ignore
            memory.copy(changetype<usize>(out) + offset, changetype<usize>(data.buffer), data.buffer.byteLength);
            return out;
            // @ts-ignore
        } else if (isDefined(data.__TBS_Serialize)) {
            // @ts-ignore
            const out = buffer ? buffer : new ArrayBuffer(sizeOf(data));
            // @ts-ignore
            data.__TBS_Serialize(data, out, offset);
            return out;
        }
        return unreachable();
    }
    // @ts-ignore
    @inline export function parse<T>(buffer: ArrayBuffer, data: T | null = null, offset: i32 = 0): T {
        if (isString<T>()) {
            // @ts-ignore
            const out = data ? data : changetype<String>(__new(buffer.byteLength - 1, idof<String>()));
            // @ts-ignore
            memory.copy(changetype<usize>(out), changetype<usize>(buffer) + offset + <usize>1, buffer.byteLength - 1);
            // @ts-ignore
            return out;
            // @ts-ignore
        } else if (isArray<T>()) {
            const arr = data ? data : changetype<T>(__new(offsetof<T>(), idof<T>()));
            store<usize>(changetype<usize>(arr), changetype<usize>(buffer), offsetof<T>("dataStart"));
            // @ts-ignore
            arr.byteLength = buffer.byteLength;
            // @ts-ignore
            arr.buffer = buffer;
            // @ts-ignore
            arr.length = buffer.byteLength / sizeof<valueof<T>>();
            return arr;
        } else if (isManaged<T>() || isReference<T>()) {
            if (idof<T>() == idof<Variant>()) {
                // @ts-ignore
                return parseArbitrary(buffer, load<u8>(changetype<usize>(buffer)));
                // @ts-ignore
            } else if (isDefined(changetype<nonnull<T>>(0).__TBS_Deserialize)) {
                const out = data ? data! : changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>())).__TBS_Instantiate();
                // @ts-ignore
                out.__TBS_Deserialize(buffer, out);
                return out;
            }
            return unreachable();
        } else {
            return unreachable();
        }
    }
    @inline export function sizeOf<T>(data: T): i32 {
        // @ts-ignore
        return data.__TBS_Size;
    }
}

/*
// @ts-ignore
function parseArbitrary(data: ArrayBuffer, type: i32): Variant {
    switch (type) {
        case TBS.Types.StringU8: {
            // @ts-ignore
            return Variant.from<string>(TBS.parse<string>(data));
        } case TBS.Types.StringU16: {
            // @ts-ignore
            return Variant.from<string>(TBS.parse<string>(data));
        } case TBS.Types.ArrayU8: {
            // @ts-ignore
            return Variant.from<u8[]>(TBS.parse<u8[]>(data));
        } case TBS.Types.ArrayI8: {
            // @ts-ignore
            return Variant.from<i8[]>(TBS.parse<i8[]>(data));
        } case TBS.Types.ArrayU16: {
            // @ts-ignore
            return Variant.from<u16[]>(TBS.parse<u16[]>(data));
        } case TBS.Types.ArrayI16: {
            // @ts-ignore
            return Variant.from<i16[]>(TBS.parse<i16[]>(data));
        } case TBS.Types.ArrayU32: {
            // @ts-ignore
            return Variant.from<u32[]>(TBS.parse<u32[]>(data));
        } case TBS.Types.ArrayI32: {
            // @ts-ignore
            return Variant.from<i32[]>(TBS.parse<i32[]>(data));
        } case TBS.Types.ArrayU64: {
            // @ts-ignore
            return Variant.from<u64[]>(TBS.parse<u64[]>(data));
        } case TBS.Types.ArrayI64: {
            // @ts-ignore
            return Variant.from<i64[]>(TBS.parse<i64[]>(data));
        } case TBS.Types.ArrayF32: {
            // @ts-ignore
            return Variant.from<f32[]>(TBS.parse<f32[]>(data));
        } case TBS.Types.ArrayF64: {
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
}*/

// @ts-ignore
@inline export function serializeDeepArray<T extends Array<any>>(data: T, out: ArrayBuffer, depth: usize = 1, offset: i32 = 0): void {
    if (isArray<valueof<valueof<T>>>()) {
        serializeDeepArray<valueof<T>>(data[0], out, ++depth);
    } else {
        const type: valueof<valueof<T>> = (isManaged<valueof<valueof<T>>>() || isReference<valueof<valueof<T>>>()) ? changetype<valueof<valueof<T>>>(0) : 0;
        // @ts-ignore
        if (type instanceof u8 || type instanceof i8) {
            store<u8>(changetype<usize>(out), TBS.Types.ArrayDimU8);
            store<u8>(changetype<usize>(out) + <usize>1 + offset, depth);
            store<u16>(changetype<usize>(out) + <usize>2 + offset, TBS.sizeOf(data))
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