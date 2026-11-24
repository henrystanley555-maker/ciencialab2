/**
 * Lightweight, zero-dependency ZIP Central Directory reader.
 * Reads entry file names directly from an in-memory Buffer without unpacking to disk.
 */
export function extractZipEntryNames(buffer: Buffer, maxEntries = 60): string[] {
  try {
    if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
      return [];
    }

    // Locate End of Central Directory signature (PK\x05\x06 = 0x06054b50)
    const minOffset = Math.max(0, buffer.length - 65558);
    let eocdOffset = -1;
    for (let i = buffer.length - 22; i >= minOffset; i--) {
      if (
        buffer[i] === 0x50 &&
        buffer[i + 1] === 0x4b &&
        buffer[i + 2] === 0x05 &&
        buffer[i + 3] === 0x06
      ) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      return [];
    }

    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

    if (cdOffset >= buffer.length || totalEntries === 0) {
      return [];
    }

    const entries: string[] = [];
    let cursor = cdOffset;
    const limit = Math.min(totalEntries, 250);

    for (let i = 0; i < limit && cursor + 46 <= buffer.length; i++) {
      // Central Directory File Header signature: PK\x01\x02
      if (
        buffer[cursor] !== 0x50 ||
        buffer[cursor + 1] !== 0x4b ||
        buffer[cursor + 2] !== 0x01 ||
        buffer[cursor + 3] !== 0x02
      ) {
        break;
      }

      const fileNameLen = buffer.readUInt16LE(cursor + 28);
      const extraLen = buffer.readUInt16LE(cursor + 30);
      const commentLen = buffer.readUInt16LE(cursor + 32);

      const nameStart = cursor + 46;
      const nameEnd = nameStart + fileNameLen;
      if (nameEnd > buffer.length) break;

      const rawName = buffer.slice(nameStart, nameEnd).toString('utf8').trim();
      cursor = nameEnd + extraLen + commentLen;

      if (!rawName || rawName.endsWith('/') || rawName.startsWith('__MACOSX/')) {
        continue;
      }

      entries.push(rawName);
      if (entries.length >= maxEntries) break;
    }

    return entries;
  } catch {
    return [];
  }
}
