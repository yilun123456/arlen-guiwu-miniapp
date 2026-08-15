from pathlib import Path
import json
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]


for path in ROOT.rglob('*.json'):
    json.loads(path.read_text(encoding='utf-8'))

for path in ROOT.rglob('*.wxml'):
    source = path.read_text(encoding='utf-8').replace('wx:', 'wx_')
    ET.fromstring(source)

for path in ROOT.rglob('*.wxss'):
    source = path.read_text(encoding='utf-8')
    if source.count('{') != source.count('}'):
        raise AssertionError(f'Unbalanced WXSS braces: {path}')

print('JSON, WXML and WXSS structure checks passed')
