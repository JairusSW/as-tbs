// XXHash 32-bit as a starting point, see: https://cyan4973.github.io/xxHash
// primes
const XXH32_P1 = 2654435761;
const XXH32_P2 = 2246822519;
const XXH32_P3 = 3266489917;
const XXH32_P4 = 668265263;
const XXH32_P5 = 374761393;
const XXH32_SEED = 0;
function rotl(value, shift) {
    shift &= 31;
    return (value << shift) | (value >>> (32 - shift));
}
export function hash32(key, len = 4) {
    let h = XXH32_SEED + XXH32_P5 + len;
    h += key * XXH32_P3;
    h = rotl(h, 17) * XXH32_P4;
    h ^= h >> 15;
    h *= XXH32_P2;
    h ^= h >> 13;
    h *= XXH32_P3;
    h ^= h >> 16;
    return h;
}
function mix(h, key) {
    return rotl(h + key * XXH32_P2, 13) * XXH32_P1;
}
export function hashStr(key) {
    if (!key.length)
        return XXH32_SEED;
    const u8Arr = stringToUint8Array(key);
    const u32Arr = new Uint32Array(u8Arr.buffer, u8Arr.byteOffset, u8Arr.byteLength / 4);
    console.log("u32Arr: ", u32Arr, u32Arr[0], u32Arr[4]);
    let h = key.length << 1;
    let len = h;
    let pos = 0;
    if (len >= 16) {
        let s1 = XXH32_SEED + XXH32_P1 + XXH32_P2;
        let s2 = XXH32_SEED + XXH32_P2;
        let s3 = XXH32_SEED;
        let s4 = XXH32_SEED - XXH32_P1;
        let end = len - 16;
        while (pos <= end) {
            s1 = mix(s1, u32Arr[pos]);
            s2 = mix(s2, u32Arr[pos + 4]);
            s3 = mix(s3, u32Arr[pos + 8]);
            s4 = mix(s4, u32Arr[pos + 12]);
            pos += 16;
        }
        h += rotl(s1, 1) + rotl(s2, 7) + rotl(s3, 12) + rotl(s4, 18);
    }
    else {
        h += XXH32_SEED + XXH32_P5;
    }
    let end = len - 4;
    while (pos <= end) {
        h += u32Arr[pos] * XXH32_P3;
        h = rotl(h, 17) * XXH32_P4;
        pos += 4;
    }
    end = len;
    while (pos < end) {
        h += u8Arr[pos] * XXH32_P5;
        h = rotl(h, 11) * XXH32_P1;
        pos++;
    }
    h ^= h >> 15;
    h *= XXH32_P2;
    h ^= h >> 13;
    h *= XXH32_P3;
    h ^= h >> 16;
    return h;
}
// 690424818
export function stringToUint8Array(str) {
    let c, hi, lo;
    const byteArray = new Uint8Array(str.length * 2);
    let pos = 0;
    for (let i = 0; i < str.length; ++i) {
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray[pos] = lo;
        byteArray[pos + 1] = hi;
        pos = pos + 2;
    }
    return byteArray;
}
