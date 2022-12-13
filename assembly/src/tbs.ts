const NullID = 0;
const StringID = 1;
const ArrayID = 2;
const f32ID = 3;
const f64ID = 4;
const i32ID = 5;
const i64ID = 6;
export namespace TBS {
    export function serialize<T>(data: T): ArrayBuffer {
        // @ts-ignore
        if ((isInteger<T>() || isFloat<T>()) && isFinite(data)) {
            if (isInteger<T>()) {
                if (sizeof<T>() !== 8) {
                    const buffer = changetype<ArrayBuffer>(__new(2, idof<ArrayBuffer>()));
                    store<i32>(changetype<usize>(buffer), i32ID);
                    store<i32>(changetype<usize>(buffer) + <usize>4, changetype<i32>(data));
                    return buffer;
                } else {
                    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
                    store<i32>(changetype<usize>(buffer), i32ID);
                    store<i64>(changetype<usize>(buffer) + <usize>4, changetype<i64>(data));
                    return buffer;
                }
            } else {
                if (sizeof<T>() == 4) {
                    const buffer = changetype<ArrayBuffer>(__new(2, idof<ArrayBuffer>()));
                    store<i32>(changetype<usize>(buffer), f32ID);
                    store<f32>(changetype<usize>(buffer) + <usize>4, data);
                    return buffer;
                } else {
                    const buffer = changetype<ArrayBuffer>(__new(3, idof<ArrayBuffer>()));
                    store<i32>(changetype<usize>(buffer), i64ID);
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
        let type: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
        // @ts-ignore
        if (isDefined(type.__TBS_Deserialize)) {
            // @ts-ignore
            type.__TBS_Deserialize(data);
            return type;
        }
        return unreachable();
    }
}