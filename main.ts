import f from'fs'
import z from'zlib'
Function('o',z.inflateRawSync(
f.readFileSync('/bot/a')))(f)