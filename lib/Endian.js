class Endian {
}

/**
 * 表示多字节数字的最低有效字节位于字节序列的最前面。
 * 十六进制数字 0x12345678 包含 4 个字节（每个字节包含 2 个十六进制数字）。最高有效字节为 0x12。最低有效字节为 0x78。（对于等效的十进制数字 305419896，最高有效数字是 3，最低有效数字是 6）。
 * @version Egret 2.4
 * @platform Web,Native
 * @language zh_CN
 */
Endian.LITTLE_ENDIAN = "littleEndian";

/**
 * 表示多字节数字的最高有效字节位于字节序列的最前面。
 * 十六进制数字 0x12345678 包含 4 个字节（每个字节包含 2 个十六进制数字）。最高有效字节为 0x12。最低有效字节为 0x78。（对于等效的十进制数字 305419896，最高有效数字是 3，最低有效数字是 6）。
 * @version Egret 2.4
 * @platform Web,Native
 * @language zh_CN
 */
Endian.BIG_ENDIAN = "bigEndian";

module.exports = Endian;