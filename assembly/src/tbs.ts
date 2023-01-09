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
        /*if (nameof<string8>() == nameof<T>()) {
            // Doesn't work
        } else */if (isString<T>()) {
            // UTF-16 String
            const out = new ArrayBuffer(((<string>data).length << 1) + 3);
            store<u8>(changetype<usize>(out), String16ID);
            store<u16>(changetype<usize>(out) + <usize>1, (<string>data).length);
            memory.copy(changetype<usize>(out) + <usize>3, changetype<usize>(data), (<string>data).length << 1);
            return out;
        } else if (isBoolean<T>()) {
            const out = new ArrayBuffer(1);
            store<bool>(changetype<usize>(out), <bool>data);
            return out;
        } else if (data instanceof i32) {
            const out = new ArrayBuffer(4);
            store<i32>(changetype<usize>(out), <i32>data);
            return out;
        } else if (data instanceof u32) {
            const out = new ArrayBuffer(4);
            store<i32>(changetype<usize>(out), <u32>data);
            return out;
        } else if (data instanceof i64) {
            const out = new ArrayBuffer(8);
            store<i64>(changetype<usize>(out), <i64>data);
            return out;
        } else if (data instanceof u64) {
            const out = new ArrayBuffer(8);
            store<u64>(changetype<usize>(out), <u64>data);
            return out;
        } else if (data instanceof f32) {
            const out = new ArrayBuffer(4);
            store<f32>(changetype<usize>(out), <f32>data);
            return out;
        } else if (data instanceof f64) {
            const out = new ArrayBuffer(8);
            store<f64>(changetype<usize>(out), <f64>data);
            return out;
        } else if (isDefined(data.__TBS_ByteLength)) {
            // @ts-ignore
            const out = new ArrayBuffer(data.__TBS_ByteLength());
            // @ts-ignore
            data.__TBS_Serialize(data, out);
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
        } else if (isDefined(data.__TBS_ByteLength)) {
            // @ts-ignore
            data.__TBS_Serialize(data, out);
        }
        return unreachable();
    }
    // @ts-ignore
    @inline export function parse<T>(data: ArrayBuffer): T {
        if (isString<T>()) {
            // @ts-ignore
            return String.UTF16.decodeUnsafe(changetype<usize>(data) + <usize>3, (load<u16>(changetype<usize>(data) + <usize>1) << 1));
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
        }
        return unreachable();
    }
}