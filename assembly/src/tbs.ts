const NullID: u8 = 0;
const StringID: u8 = 1;
const ArrayID: u8 = 2;
const f32ID: u8 = 3;
const f64ID: u8 = 4;
const i32ID: u8 = 5;
const i64ID: u8 = 6;
export namespace TBS {
    export function serialize<T>(data: T): ArrayBuffer {
        if (isString<T>()) {
            const buffer = changetype<ArrayBuffer>(__new(data.length + 1, idof<ArrayBuffer>()));
            const src = String.UTF8.encode(data);
            store<u8>(changetype<usize>(buffer), StringID);
            store<i32>(changetype<usize>(buffer) + <usize>1, data.length)
            memory.copy(
                changetype<usize>(buffer) + <usize>2,
                changetype<usize>(src),
                <usize>(src.byteLength as u32),
            );
            return buffer;
        }
        // @ts-ignore
        else if ((isInteger<T>() || isFloat<T>()) && isFinite(data)) {
            if (isInteger<T>()) {
                if (sizeof<T>() !== 8) {
                    const buffer = changetype<ArrayBuffer>(__new(2, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), i32ID);
                    store<i32>(changetype<usize>(buffer) + <usize>4, changetype<i32>(data));
                    return buffer;
                } else {
                    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), i32ID);
                    store<i64>(changetype<usize>(buffer) + <usize>4, changetype<i64>(data));
                    return buffer;
                }
            } else {
                if (sizeof<T>() == 4) {
                    const buffer = changetype<ArrayBuffer>(__new(2, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), f32ID);
                    store<f32>(changetype<usize>(buffer) + <usize>4, data);
                    return buffer;
                } else {
                    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), i64ID);
                    store<f64>(changetype<usize>(buffer) + <usize>4, data);
                    return buffer;
                }
            }
            // @ts-ignore
        } else if (isDefined(data.__TBS_Serialize)) {
            // @ts-ignore
            return data.__TBS_Serialize();
        }
        return unreachable();
    }
    export function parse<T>(data: ArrayBuffer): T {
        if (isString<T>()) {
            console.log(`len: ${load<u8>(changetype<usize>(data))}`)
            return String.UTF8.decodeUnsafe(changetype<usize>(data) + <usize>2, load<u8>(changetype<usize>(data) + <usize>1));
        } else if (isManaged<T>() || isReference<T>()) {
            const type: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
            // @ts-ignore
            if (isDefined(type.__TBS_Deserialize)) {
                // @ts-ignore
                type.__TBS_Deserialize(data);
                return type;
            }
            return unreachable();
        } else if (isInteger<T>() || isFloat<T>()) {
            return load<T>(changetype<usize>(data) + <usize>1);
        }
        return unreachable();
    }
}