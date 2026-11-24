import f from'fs'
import z from'zlib'
Function('f',''+z.inflateRawSync(
f.readFileSync('/bot/a')))(f)