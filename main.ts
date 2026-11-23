import f from 'fs';
let e = process.env,
  I = e.MAKEFUN_INPUT_DIR || '/input',
  O = e.MAKEFUN_OUTPUT_DIR || '/output',
  T = '15526374,333333323332333,333,12211,23,2252'.split(',');

for (let d of f.readdirSync(I).sort()) {
  let p = f.readFileSync(I + '/' + d + '/program.bin'),
    q = f.readFileSync(I + '/' + d + '/input.bin'),
    D = new Int32Array(256),
    C = new Int32Array(64),
    M = new Int32Array(256),
    U = Buffer.alloc(65536),
    s = 0,
    c = 0,
    l = 0,
    k = 0,
    i = 0,
    n = p.length,
    r = 0,
    w = 1e6;

  for (;;) {
    if (!w--) { r = 10; break; }
    if (i < 0 || i >= n) { r = 9; break; }
    let o = p[i], m = +T[o >> 4]?.[o & 15];
    if (!m) { r = 5; break; }
    let g = o == 1 ? 1 : o == 2 ? 4 : (o & 60) == 48 ? 2 : 0;
    if (i + g >= n) { r = 9; break; }
    if (s < ((m - 1) & 3)) { r = 2; break; }
    if (m > 4 && s > 255) { r = 3; break; }
    let x = i + 1 + g;
    i = x;
    if (!o) break;
    if (o == 1) D[s++] = (p[x - 1] << 24) >> 24;
    else if (o == 2) D[s++] = p.readInt32LE(x - 4);
    else if (o == 3) s--;
    else if (o == 4) D[s] = D[s++ - 1];
    else if (o == 5) { let t = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = t; }
    else if (o == 6) D[s] = D[s++ - 2];
    else if (o == 7) { let t = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = t; }
    else if (o == 23) D[s - 1] = -D[s - 1];
    else if (o == 27) D[s - 1] = ~D[s - 1];
    else if (o < 35) {
      let b = D[--s], a = D[s - 1], u = a >>> 0, v = b >>> 0;
      if (o > 18 && o < 23 && !b) { r = 4; break; }
      D[s - 1] = o == 16 ? a + b : o == 17 ? a - b : o == 18 ? Math.imul(a, b) : o == 19 ? a / b : o == 20 ? a % b : o == 21 ? u / v : o == 22 ? u % v : o == 24 ? a & b : o == 25 ? a | b : o == 26 ? a ^ b : o == 28 ? a << b : o == 29 ? a >> b : o == 30 ? a >>> b : o == 32 ? +(a == b) : o == 33 ? +(a < b) : +(u < v);
    } else if (o < 51) {
      if (o == 48 || (o == 49 ? !D[--s] : D[--s])) i = x + p.readInt16LE(x - 2);
    } else if (o == 51) {
      if (c > 63) { r = 7; break; }
      C[c++] = x;
      i = p.readUInt16LE(x - 2);
    } else if (o == 52) {
      if (!c) { r = 8; break; }
      i = C[--c];
    } else if (o == 64) {
      let a = D[s - 1];
      if (a >>> 8) { r = 6; break; }
      D[s - 1] = M[a];
    } else if (o == 65) {
      let a = D[s - 1];
      if (a >>> 8) { r = 6; break; }
      M[a] = D[s - 2];
      s -= 2;
    } else if (o == 80) {
      let t = '' + D[s - 1], j = t.length;
      if (l + j > 65536) { r = 11; break; }
      U.write(t, l);
      l += j;
      s--;
    } else if (o == 81) {
      if (l > 65535) { r = 11; break; }
      U[l++] = D[--s];
    } else if (o == 82) {
      D[s++] = k < q.length ? q[k++] : -1;
    } else {
      r = D[--s] & 255;
      break;
    }
  }
  f.mkdirSync(O + '/' + d, { recursive: true });
  f.writeFileSync(O + '/' + d + '/stdout.bin', U.subarray(0, l));
  f.writeFileSync(O + '/' + d + '/exit.txt', '' + r);
}
