const EPOCH = 1672531200000n;

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export class Snowflake {
  private workerId: bigint;
  private sequence: bigint = BigInt(Math.floor(Math.random() * 4096));
  private lastTimestamp: bigint = 0n;

  constructor(workerId: number = 1) {
    this.workerId = BigInt(workerId) & 0x3FFn;
  }

  nextId(): string {
    let timestamp = BigInt(Date.now()) - EPOCH;

    if (timestamp < this.lastTimestamp) {
      timestamp = this.lastTimestamp;
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 0xFFFn;
      if (this.sequence === 0n) {
        while (BigInt(Date.now()) - EPOCH <= this.lastTimestamp) {
          // spin
        }
        timestamp = BigInt(Date.now()) - EPOCH;
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    const id = (timestamp << 22n) | (this.workerId << 12n) | this.sequence;

    return this.toBase62(id, 15);
  }

  private toBase62(value: bigint, padLength: number): string {
    if (value === 0n) return '0'.repeat(padLength);
    let result = '';
    const base = 62n;
    let v = value;
    while (v > 0n) {
      result = BASE62[Number(v % base)] + result;
      v = v / base;
    }
    return result.padStart(padLength, '0');
  }
}

export const snowflake = new Snowflake(1);
