const NullID = 0;
const ObjectID = 1;
const StringID = 2;
const ArrayID = 3;
const NumberID = 4;
export namespace TBS {
    export function serialize<T>(data: T): ArrayBuffer {
        /*// @ts-ignore
        if ((isInteger<T>() || isFloat<T>()) && isFinite(data)) {
            // @ts-ignore
            return [NumberID, data];
        } else if (isString<T>()) {
            // @ts-ignore
            return [StringID, NullID];
            // @ts-ignore
        } else */if (isDefined(data.__TBS_Serialize)) {
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