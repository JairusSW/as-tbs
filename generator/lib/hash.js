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
    let h = key.length << 1;
    let len = h;
    let pos = 0;
    if (len >= 16) {
        let s1 = XXH32_SEED + XXH32_P1 + XXH32_P2;
        let s2 = XXH32_SEED + XXH32_P2;
        let s3 = XXH32_SEED;
        let s4 = XXH32_SEED - XXH32_P1;
        let end = len + pos - 16;
        while (pos <= end) {
            s1 = mix(s1, getU32(u8Arr, pos, false));
            s2 = mix(s2, getU32(u8Arr, pos + 4, false));
            s3 = mix(s3, getU32(u8Arr, pos + 8, false));
            s4 = mix(s4, getU32(u8Arr, pos + 12, false));
            pos += 16;
        }
        h += rotl(s1, 1) + rotl(s2, 7) + rotl(s3, 12) + rotl(s4, 18);
    }
    else {
        h += XXH32_SEED + XXH32_P5;
    }
    let end = len - 4;
    while (pos <= end) {
        h += getU32(u8Arr, pos, false) * XXH32_P3;
        h = rotl(h, 17) * XXH32_P4;
        pos += 4;
    }
    end = len;
    while (pos < end) {
        h += getU32(u8Arr, pos, false) * XXH32_P5;
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
    /* let c, hi, lo;
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
     return byteArray;*/
    const byteArray = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        byteArray[i] = str.charCodeAt(i);
    }
    return byteArray;
}
function getU32(buffer, byteOffset, littleEndian = true) {
    if (littleEndian) {
        return (buffer[byteOffset] + (buffer[byteOffset + 1] << 8) + (buffer[byteOffset + 2] << 16) + (buffer[byteOffset + 3] << 24)) >>> 0;
    }
    else {
        return ((buffer[byteOffset] << 24) >>> 1) + ((buffer[byteOffset + 1] << 16) | (buffer[byteOffset + 2] << 8) | buffer[byteOffset + 3]);
    }
}
