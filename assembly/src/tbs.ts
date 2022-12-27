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
    // @ts-ignore
    @inline
    export function serialize<T>(data: T): ArrayBuffer {
        // @ts-ignore
        if (isDefined(data.__TBS_Serialize)) {
            // @ts-ignore
            return data.__TBS_Serialize();
        }
        return unreachable();
    }
    // @ts-ignore
    @inline
    export function serializeField<T>(data: T, index: u8): ArrayBuffer {
        // @ts-ignore
        return data.__TBS_Serialize_Field<i8>(index);
    }
    // @ts-ignore
    @inline
    export function parse<T>(data: ArrayBuffer): T {
        if (isManaged<T>() || isReference<T>()) {
            // @ts-ignore
            const type: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
            // @ts-ignore
            if (isDefined(type.__TBS_Deserialize)) {
                // @ts-ignore
                type.__TBS_Deserialize(data);
                return type;
            }
            return unreachable();
        }
        return unreachable();
    }
    // @ts-ignore
    @inline
    export function parseTo<T>(data: ArrayBuffer, t: T): T {
        t.__TBS_Deserialize(data);
        return t;
    }
    // @ts-ignore
    @inline
        export function parseField<T>(to: T, index: u8): T {
        // @ts-ignore
        return to.__TBS_Deserialize_Field<T>(index, to);
    }
}