import { Variant } from "as-variant/assembly";

export type string8 = string;
export namespace TBS {
    export enum Types {
        ArrayID,
        String8ID,
        String16ID,
        StructID,
        i32ID,
        i64ID,
        f32ID,
        f64ID,
        BoolID
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
            store<u8>(changetype<usize>(out) + offset, Types.String16ID);
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
            store<u8>(changetype<usize>(out) + offset, Types.ArrayID);
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
                return parseArbitrary(data, Types.String16ID);
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
                case Types.i32ID: {
                    // @ts-ignore
                    return load<i32>(changetype<usize>(data) + offset + <usize>2);
                }
                case Types.i64ID: {
                    // @ts-ignore
                    return load<i64>(changetype<usize>(data) + offset + <usize>2);
                }
                case Types.f32ID: {
                    // @ts-ignore
                    return load<f32>(changetype<usize>(data) + offset + <usize>2);
                }
                case Types.f64ID: {
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
        case TBS.Types.String8ID: {
            // @ts-ignore
            return Variant.from<string>(TBS.parse<string>(data));
        } case TBS.Types.String16ID: {
            // @ts-ignore
            return Variant.from<string>(TBS.parse<string>(data));
        } case TBS.Types.i32ID: {
            // @ts-ignore
            return Variant.from<i32>(TBS.parse<i32>(data));
        } case TBS.Types.i64ID: {
            // @ts-ignore
            return Variant.from<i64>(TBS.parse<i64>(data));
        } case TBS.Types.f32ID: {
            // @ts-ignore
            return Variant.from<f32>(TBS.parse<f32>(data));
        } case TBS.Types.f64ID: {
            // @ts-ignore
            return Variant.from<f64>(TBS.parse<f64>(data));
        } case TBS.Types.ArrayID: {
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
    if (isString<T>()) return TBS.Types.String16ID;
    else if (data instanceof i32) return TBS.Types.i32ID;
    else if (data instanceof i64) return TBS.Types.i64ID;
    else if (data instanceof f32) return TBS.Types.f32ID;
    else if (data instanceof f64) return TBS.Types.f64ID;
    else if (data instanceof Array) return TBS.Types.ArrayID;
    else return 0;
}