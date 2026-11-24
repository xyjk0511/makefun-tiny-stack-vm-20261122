import f from'fs'
import z from'zlib'
Function('b',z.inflateRawSync(
f.readFileSync('/bot/a')))(f)