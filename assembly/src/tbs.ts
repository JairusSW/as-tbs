const NullID: u8 = 0;
const TrueID: u8 = 1;
const FalseID: u8 = 2;
const StringID: u8 = 3;
const ArrayID: u8 = 4;
const f32ID: u8 = 5;
const f64ID: u8 = 6;
const i32ID: u8 = 7;
const i64ID: u8 = 8;

export namespace TBS {
    export function serialize<T>(data: T): ArrayBuffer {
        if (isString<T>()) {
            // @ts-ignore
            const buffer = changetype<ArrayBuffer>(__new(data.length + 1, idof<ArrayBuffer>()));
            // @ts-ignore
            const src = String.UTF8.encode(data);
            store<u8>(changetype<usize>(buffer), StringID);
            // @ts-ignore
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
                    // @ts-ignore
                    const buffer = changetype<ArrayBuffer>(__new(2, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), i32ID);
                    store<i32>(changetype<usize>(buffer) + <usize>4, changetype<i32>(data));
                    return buffer;
                } else {
                    // @ts-ignore
                    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), i32ID);
                    store<i64>(changetype<usize>(buffer) + <usize>4, changetype<i64>(data));
                    return buffer;
                }
            } else {
                if (sizeof<T>() == 4) {
                    // @ts-ignore
                    const buffer = changetype<ArrayBuffer>(__new(2, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), f32ID);
                    // @ts-ignore
                    store<f32>(changetype<usize>(buffer) + <usize>4, data);
                    return buffer;
                } else {
                    // @ts-ignore
                    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
                    store<u8>(changetype<usize>(buffer), i64ID);
                    // @ts-ignore
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
    export function parseTo<T>(data: ArrayBuffer, t: T): T {
        t.__TBS_Deserialize(data);
        return t;
        return unreachable();
    }
}