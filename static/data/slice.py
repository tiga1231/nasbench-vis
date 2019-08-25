import json
import sys

n = int(sys.argv[1])
fn = sys.argv[2] if len(sys.argv)>2 else 'data-full.json'
fout = 'data-{:d}k.json'.format(n//1000)

with open(fn) as f:
    data = json.load(f)

for k in data:
    data[k] = data[k][:n]

with open(fout, 'w') as fo:
    json.dump(data, fo, indent=2)

