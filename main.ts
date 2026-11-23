import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OPS: Record<number, [number, number, number]> = {
  0x00: [0, 0, 0],
  0x01: [1, 0, 1],
  0x02: [4, 0, 1],
  0x03: [0, 1, 0],
  0x04: [0, 1, 2],
  0x05: [0, 2, 2],
  0x06: [0, 2, 3],
  0x07: [0, 3, 3],
  0x10: [0, 2, 1],
  0x11: [0, 2, 1],
  0x12: [0, 2, 1],
  0x13: [0, 2, 1],
  0x14: [0, 2, 1],
  0x15: [0, 2, 1],
  0x16: [0, 2, 1],
  0x17: [0, 1, 1],
  0x18: [0, 2, 1],
  0x19: [0, 2, 1],
  0x1a: [0, 2, 1],
  0x1b: [0, 1, 1],
  0x1c: [0, 2, 1],
  0x1d: [0, 2, 1],
  0x1e: [0, 2, 1],
  0x20: [0, 2, 1],
  0x21: [0, 2, 1],
  0x22: [0, 2, 1],
  0x30: [2, 0, 0],
  0x31: [2, 1, 0],
  0x32: [2, 1, 0],
  0x33: [2, 0, 0],
  0x34: [0, 0, 0],
  0x40: [0, 1, 1],
  0x41: [0, 2, 0],
  0x50: [0, 1, 0],
  0x51: [0, 1, 0],
  0x52: [0, 0, 1],
  0x53: [0, 1, 0],
};

function runVm(prog: Uint8Array, inp: Uint8Array): { out: Uint8Array; code: number } {
  const n = prog.length;
  const D = new Int32Array(256);
  const C = new Int32Array(64);
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0;
  let csp = 0;
  let olen = 0;
  let inPos = 0;
  let pc = 0;
  let steps = 0;
  const finish = (code: number) => ({ out: out.subarray(0, olen), code });

  for (;;) {
    if (steps === 1_000_000) return finish(10);
    if (pc < 0 || pc >= n) return finish(9);
    const op = prog[pc];
    const meta = OPS[op];
    if (!meta) return finish(5);
    const [imm, pops, pushes] = meta;
    if (pc + imm >= n) return finish(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return finish(2);
    if (sp - pops + pushes > 256) return finish(3);
    pc = next;

    switch (op) {
      case 0x00:
        return finish(0);
      case 0x01:
        D[sp++] = (prog[next - 1] << 24) >> 24;
        break;
      case 0x02:
        D[sp++] = prog[next - 4] | (prog[next - 3] << 8) | (prog[next - 2] << 16) | (prog[next - 1] << 24);
        break;
      case 0x03:
        sp--;
        break;
      case 0x04:
        D[sp] = D[sp - 1];
        sp++;
        break;
      case 0x05: {
        const t = D[sp - 1];
        D[sp - 1] = D[sp - 2];
        D[sp - 2] = t;
        break;
      }
      case 0x06:
        D[sp] = D[sp - 2];
        sp++;
        break;
      case 0x07: {
        const a = D[sp - 3];
        D[sp - 3] = D[sp - 2];
        D[sp - 2] = D[sp - 1];
        D[sp - 1] = a;
        break;
      }
      case 0x10:
        D[sp - 2] = (D[sp - 2] + D[sp - 1]) | 0;
        sp--;
        break;
      case 0x11:
        D[sp - 2] = (D[sp - 2] - D[sp - 1]) | 0;
        sp--;
        break;
      case 0x12:
        D[sp - 2] = Math.imul(D[sp - 2], D[sp - 1]);
        sp--;
        break;
      case 0x13: {
        const b = D[sp - 1];
        if (b === 0) return finish(4);
        D[sp - 2] = (D[sp - 2] / b) | 0;
        sp--;
        break;
      }
      case 0x14: {
        const b = D[sp - 1];
        if (b === 0) return finish(4);
        D[sp - 2] = (D[sp - 2] % b) | 0;
        sp--;
        break;
      }
      case 0x15: {
        const b = D[sp - 1];
        if (b === 0) return finish(4);
        D[sp - 2] = ((D[sp - 2] >>> 0) / (b >>> 0)) | 0;
        sp--;
        break;
      }
      case 0x16: {
        const b = D[sp - 1];
        if (b === 0) return finish(4);
        D[sp - 2] = ((D[sp - 2] >>> 0) % (b >>> 0)) | 0;
        sp--;
        break;
      }
      case 0x17:
        D[sp - 1] = -D[sp - 1] | 0;
        break;
      case 0x18:
        D[sp - 2] &= D[sp - 1];
        sp--;
        break;
      case 0x19:
        D[sp - 2] |= D[sp - 1];
        sp--;
        break;
      case 0x1a:
        D[sp - 2] ^= D[sp - 1];
        sp--;
        break;
      case 0x1b:
        D[sp - 1] = ~D[sp - 1];
        break;
      case 0x1c:
        D[sp - 2] <<= D[sp - 1];
        sp--;
        break;
      case 0x1d:
        D[sp - 2] >>= D[sp - 1];
        sp--;
        break;
      case 0x1e:
        D[sp - 2] >>>= D[sp - 1];
        sp--;
        break;
      case 0x20:
        D[sp - 2] = D[sp - 2] === D[sp - 1] ? 1 : 0;
        sp--;
        break;
      case 0x21:
        D[sp - 2] = D[sp - 2] < D[sp - 1] ? 1 : 0;
        sp--;
        break;
      case 0x22:
        D[sp - 2] = (D[sp - 2] >>> 0) < (D[sp - 1] >>> 0) ? 1 : 0;
        sp--;
        break;
      case 0x30:
      case 0x31:
      case 0x32: {
        const rel = ((prog[next - 2] | (prog[next - 1] << 8)) << 16) >> 16;
        if (op === 0x30 || (op === 0x31 ? D[--sp] === 0 : D[--sp] !== 0)) pc = next + rel;
        break;
      }
      case 0x33:
        if (csp === 64) return finish(7);
        C[csp++] = next;
        pc = prog[next - 2] | (prog[next - 1] << 8);
        break;
      case 0x34:
        if (csp === 0) return finish(8);
        pc = C[--csp];
        break;
      case 0x40: {
        const addr = D[sp - 1];
        if (addr >>> 8) return finish(6);
        D[sp - 1] = M[addr];
        break;
      }
      case 0x41: {
        const addr = D[sp - 1];
        if (addr >>> 8) return finish(6);
        M[addr] = D[sp - 2];
        sp -= 2;
        break;
      }
      case 0x50: {
        const s = String(D[sp - 1]);
        if (olen + s.length > 65536) return finish(11);
        for (let i = 0; i < s.length; i++) out[olen++] = s.charCodeAt(i);
        sp--;
        break;
      }
      case 0x51:
        if (olen >= 65536) return finish(11);
        out[olen++] = D[--sp] & 255;
        break;
      case 0x52:
        D[sp++] = inPos < inp.length ? inp[inPos++] : -1;
        break;
      case 0x53:
        return finish(D[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const { out, code } = runVm(
    new Uint8Array(readFileSync(join(I, id, 'program.bin'))),
    new Uint8Array(readFileSync(join(I, id, 'input.bin'))),
  );
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), out);
  writeFileSync(join(O, id, 'exit.txt'), `${code}\n`);
}
