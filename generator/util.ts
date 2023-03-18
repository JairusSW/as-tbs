import { TBSType } from "./type.js";

export function getWidthOf(type: TBSType) {
    switch (type.text) {
        case "u8":
        case "i8": return 1;
        case "u16":
        case "i16": return 2;
        case "u32":
        case "i32":
        case "f32": return 4;
        case "u64":
        case "i64":
        case "f64": return 8;
        case "bool":
        case "boolean": return 1;
    }
    return -1;
}

export function isPrimitive(type: TBSType): boolean {
    return getWidthOf(type) >= 0;
}