const buffer = Buffer.alloc(8)
buffer.writeBigInt64LE(0x0102030405060708n, 0)
console.log(buffer.join(" "))