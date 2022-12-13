// Please see: https://github.com/MaxGraey/as-string-sink/blob/main/assembly/index.ts

const MIN_BUFFER_LEN = 2;
const MIN_BUFFER_SIZE: u32 = MIN_BUFFER_LEN << 1;

// @ts-ignore: decorator
@inline function nextPowerOf2(n: u32): u32 {
    return 1 << 32 - clz(n - 1);
}

export class ByteSink {
    protected buffer: ArrayBuffer;
    protected offset: u32 = 0;

    static withCapacity(capacity: i32): ByteSink {
        return new ByteSink(new ArrayBuffer(0), capacity);
    }

    constructor(initial: ArrayBuffer = new ArrayBuffer(0), capacity: i32 = MIN_BUFFER_LEN) {
        var size = <u32>initial.byteLength << 1;
        this.buffer = changetype<ArrayBuffer>(__new(
            max<u32>(size, max<u32>(MIN_BUFFER_SIZE, <u32>capacity << 1)),
            idof<ArrayBuffer>())
        );
        if (size) {
            memory.copy(
                changetype<usize>(this.buffer),
                changetype<usize>(initial),
                size
            );
            this.offset += size;
        }
    }

    get length(): i32 {
        return this.offset >> 1;
    }

    get capacity(): i32 {
        return this.buffer.byteLength >>> 1;
    }

    write<T>(source: T, start: i32 = 0, end: i32 = i32.MAX_VALUE): void {
        if (source instanceof ArrayBuffer) this.writeBuffer(<ArrayBuffer>source, start, end);
        else if (source instanceof String) this.writeString(<string>source, start, end);
        else if (source instanceof Uint8Array) this.writeUint8Array(<Uint8Array>source, start, end);
        else if (source instanceof Array<u8>) this.writeArray(<Array<u8>>source, start, end);
    }

    writeUint8Array(src: Uint8Array, start: i32 = 0, end: i32 = i32.MAX_VALUE): void {
        let len = src.byteLength as u32;

        if (start != 0 || end != i32.MAX_VALUE) {
            let from: i32;
            from = min<i32>(max(start, 0), len);
            end = min<i32>(max(end, 0), len);
            start = min<i32>(from, end);
            end = max<i32>(from, end);
            len = end - start;
        }

        if (!len) return;

        this.ensureCapacity(len);

        let offset = this.offset;

        memory.copy(
            changetype<usize>(this.buffer) + <usize>offset,
            src.dataStart + <usize>start,
            <usize>len,
        );
        this.offset += len;
    }

    writeArray(src: u8[], start: i32 = 0, end: i32 = i32.MAX_VALUE): void {
        let len = src.length as u32;

        if (start != 0 || end != i32.MAX_VALUE) {
            let from: i32;
            from = min<i32>(max(start, 0), len);
            end = min<i32>(max(end, 0), len);
            start = min<i32>(from, end);
            end = max<i32>(from, end);
            len = end - start;
        }

        if (!len) return;

        this.ensureCapacity(len);

        let offset = this.offset;

        memory.copy(
            changetype<usize>(this.buffer) + <usize>offset,
            src.dataStart + <usize>start,
            <usize>len,
        );
        this.offset += len;
    }

    writeBuffer(src: ArrayBuffer, start: i32 = 0, end: i32 = i32.MAX_VALUE): void {
        let len = src.byteLength as u32;

        if (start != 0 || end != i32.MAX_VALUE) {
            let from: i32;
            from = min<i32>(max(start, 0), len);
            end = min<i32>(max(end, 0), len);
            start = min<i32>(from, end);
            end = max<i32>(from, end);
            len = end - start;
        }

        if (!len) return;

        this.ensureCapacity(len);

        let offset = this.offset;

        memory.copy(
            changetype<usize>(this.buffer) + <usize>offset,
            changetype<usize>(src) + <usize>start,
            <usize>len,
        );
        this.offset += len;
    }

    writeString(src: string, start: i32 = 0, end: i32 = i32.MAX_VALUE): void {
        let buffer = String.UTF8.encode(src.slice(start, end));
        this.writeBuffer(buffer);
    }

    writeLn(src: string = "", start: i32 = 0, end: i32 = i32.MAX_VALUE): void {
        this.writeString(src + "\r\n", start, end);
    }

    writeNumber<T extends number>(value: T): void {
        let offset = this.offset;
        let buffer = this.buffer;
        store<T>(changetype<usize>(buffer) + <usize>offset, value);
        this.offset = offset + sizeof<T>();
    }

    reserve(capacity: i32, clear: bool = false): void {
        if (clear) this.offset = 0;
        this.buffer = changetype<ArrayBuffer>(__renew(
            changetype<usize>(this.buffer),
            max<u32>(this.offset, max<u32>(MIN_BUFFER_SIZE, <u32>capacity << 1))
        ));
    }

    shrink(): void {
        this.buffer = changetype<ArrayBuffer>(__renew(
            changetype<usize>(this.buffer),
            max<u32>(this.offset, MIN_BUFFER_SIZE)
        ));
    }

    clear(): void {
        this.reserve(0, true);
    }

    toString(): string {
        let size = this.offset;
        if (!size) return "";
        return String.UTF8.decode(this.buffer);
    }

    toArrayBuffer(): ArrayBuffer {
        return this.buffer.slice();
    }

    toStaticArray(): StaticArray<u8> {
        let length = this.buffer.byteLength
        let result = new StaticArray<u8>(length);
        memory.copy(
            changetype<usize>(result),
            changetype<usize>(this.buffer),
            <usize>length,
        );
        return result;
    }

    @inline protected ensureCapacity(deltaBytes: u32): void {
        let buffer = this.buffer;
        let newSize = this.offset + deltaBytes;
        if (newSize > <u32>buffer.byteLength) {
            this.buffer = changetype<ArrayBuffer>(__renew(
                changetype<usize>(buffer),
                nextPowerOf2(newSize)
            ));
        }
    }

    get byteLength(): i32 {
        return this.offset;
    }

    read(index: i32): u8 {
        let buffer = this.buffer;
        let byteLength = buffer.byteLength;
        assert(index < byteLength);
        return load<u8>(changetype<usize>(buffer) + <usize>index);
    }

    get dataStart(): usize {
        return changetype<usize>(this.buffer);
    }
}