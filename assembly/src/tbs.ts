const NullID: u8 = 0;
const TrueID: u8 = 1;
const FalseID: u8 = 2;
const StringID: u8 = 3;
const ArrayID: u8 = 4;
const f32ID: u8 = 5;
const f64ID: u8 = 6;
const i32ID: u8 = 7;
const i64ID: u8 = 8;

export type string8 = string;
export namespace TBS {
    // @ts-ignore
    @inline export function serialize<T>(data: T): ArrayBuffer {
        // @ts-ignore
        if (isDefined(data.__TBS_ByteLength)) {
            // @ts-ignore
            const out = new ArrayBuffer(data.__TBS_ByteLength());
            // @ts-ignore
            data.__TBS_Serialize(data, out);
            return out;
        }
        return unreachable();
    }
    // @ts-ignore
    @inline export function serializeTo<T>(data: T, out: ArrayBuffer): void {
        // @ts-ignore
        if (isDefined(data.__TBS_ByteLength)) {
            // @ts-ignore
            data.__TBS_Serialize(data, out);
        }
        return unreachable();
    }
    // @ts-ignore
    @inline export function parse<T>(data: ArrayBuffer): T {
        if (isManaged<T>() || isReference<T>()) {
            // @ts-ignore
            const out: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>())).__TBS_Instantiate();
            //heap.free(changetype<usize>(out));
            // @ts-ignore
            if (isDefined(out.__TBS_Deserialize)) {
                // @ts-ignore
                out.__TBS_Deserialize(data, out);
                return out;
            }
            return unreachable();
        }
        return unreachable();
    }
    // @ts-ignore
    @inline export function parseTo<T>(data: ArrayBuffer, out: T): void {
        if (isManaged<T>() || isReference<T>()) {
            // @ts-ignore
            if (isDefined(out.__TBS_Deserialize)) {
                // @ts-ignore
                out.__TBS_Deserialize(data, out);
            }
            return unreachable();
        }
        return unreachable();
    }
}