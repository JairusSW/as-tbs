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
        //if (isDefined(T.__TBS_Serialize)) {
            // @ts-ignore
        let input = T;
            const out = new ArrayBuffer(input.__TBS_ByteLength);
            
            input.__TBS_Serialize(data, out);
            return out;
        //}
        //return unreachable();
    }
    // @ts-ignore
    @inline
    export function parse<T>(data: ArrayBuffer): T {
        //if (isManaged<T>() || isReference<T>()) {
            // @ts-ignore
        const out: nonnull<T> = changetype<nonnull<T>>(__new(offsetof<nonnull<T>>(), idof<nonnull<T>>()));
        type input = T;
            // @ts-ignore
           // if (isDefined(out.__TBS_Deserialize)) {
                // @ts-ignore
        
                T.__TBS_Deserialize(data, out);
                return out;
            //}
            //return unreachable();
       // }
        //return unreachable();
    }
}