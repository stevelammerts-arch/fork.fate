"""Inspect / surgically patch an aapt2 protobuf AndroidManifest.xml (from an .aab).

Schema (frameworks/base aapt2 Resources.proto):
  XmlNode { XmlElement element=1; string text=2; SourcePosition source=3 }
  XmlElement { ns_decl=1 rep; string namespace_uri=2; string name=3;
               XmlAttribute attribute=4 rep; XmlNode child=5 rep }
  XmlAttribute { string namespace_uri=1; string name=2; SourcePosition source=3;
                 uint32 resource_id=4; string value=5; Item compiled_item=6 }
  Item { ...; Primitive prim=7 }
  Primitive { int_decimal_value=7 (varint); int_hex=8; boolean=9; ... }

Patching is done IN-PLACE on the raw bytes (same-size varint/string swaps only),
so no re-serialization of nested length prefixes is needed.
"""
import sys

RES_IDS = {
    0x0101001E: "screenOrientation",
    0x0101021B: "versionCode",
    0x0101021C: "versionName",
    0x010102CE: "resizeableActivity",
    0x01010270: "targetSdkVersion",
    0x0101020C: "minSdkVersion",
}


def read_varint(buf, pos):
    result = 0
    shift = 0
    start = pos
    while True:
        b = buf[pos]
        result |= (b & 0x7F) << shift
        pos += 1
        if not (b & 0x80):
            return result, pos, pos - start
        shift += 7


def walk_fields(buf, start, end):
    """Yield (field_no, wire_type, value_or_span, value_byte_offset) tuples."""
    pos = start
    while pos < end:
        key, pos, _ = read_varint(buf, pos)
        field, wt = key >> 3, key & 7
        if wt == 0:  # varint
            vstart = pos
            val, pos, _ = read_varint(buf, pos)
            yield field, wt, val, vstart
        elif wt == 2:  # length-delimited
            ln, pos, _ = read_varint(buf, pos)
            yield field, wt, (pos, pos + ln), pos
            pos += ln
        elif wt == 5:  # 32-bit
            yield field, wt, int.from_bytes(buf[pos:pos + 4], "little"), pos
            pos += 4
        elif wt == 1:  # 64-bit
            yield field, wt, int.from_bytes(buf[pos:pos + 8], "little"), pos
            pos += 8
        else:
            raise ValueError(f"wiretype {wt} at {pos}")


def parse_attribute(buf, span, element_name, results):
    s, e = span
    attr = {"element": element_name, "name": "", "resource_id": None,
            "value": None, "value_span": None, "prim_offsets": [], "item_fields": [], "span": span}
    for field, wt, val, voff in walk_fields(buf, s, e):
        if field == 2 and wt == 2:
            attr["name"] = buf[val[0]:val[1]].decode("utf-8", "replace")
        elif field == 4 and wt == 0:
            attr["resource_id"] = val
        elif field == 5 and wt == 2:
            attr["value"] = buf[val[0]:val[1]].decode("utf-8", "replace")
            attr["value_span"] = val
        elif field == 6 and wt == 2:  # Item
            for f2, w2, v2, _ in walk_fields(buf, val[0], val[1]):
                if f2 == 7 and w2 == 2:  # Primitive
                    for f3, w3, v3, voff3 in walk_fields(buf, v2[0], v2[1]):
                        attr["prim_offsets"].append((f3, w3, v3, voff3))
                elif w2 == 2:  # other Item kinds (str/ref/...): dump nested
                    sub = []
                    try:
                        for f3, w3, v3, _ in walk_fields(buf, v2[0], v2[1]):
                            sub.append((f3, w3, buf[v3[0]:v3[1]].decode("utf-8", "replace") if w3 == 2 else v3))
                    except Exception:
                        sub.append(("raw", buf[v2[0]:v2[1]][:40]))
                    attr["item_fields"].append((f2, sub))
                else:
                    attr["item_fields"].append((f2, v2))
    results.append(attr)


def parse_element(buf, span, results):
    s, e = span
    name = ""
    attrs, children = [], []
    for field, wt, val, _ in walk_fields(buf, s, e):
        if field == 3 and wt == 2:
            name = buf[val[0]:val[1]].decode("utf-8", "replace")
        elif field == 4 and wt == 2:
            attrs.append(val)
        elif field == 5 and wt == 2:
            children.append(val)
    for a in attrs:
        parse_attribute(buf, a, name, results)
    for c in children:
        parse_node(buf, c, results)


def parse_node(buf, span, results):
    for field, wt, val, _ in walk_fields(buf, span[0], span[1]):
        if field == 1 and wt == 2:
            parse_element(buf, val, results)


def load(path):
    buf = bytearray(open(path, "rb").read())
    results = []
    parse_node(buf, (0, len(buf)), results)
    return buf, results


def dump(path):
    _, results = load(path)
    for a in results:
        rid = a["resource_id"]
        tag = RES_IDS.get(rid, "")
        print(f"<{a['element']}> {a['name']}{' [' + tag + ']' if tag else ''} "
              f"rid={hex(rid) if rid else '-'} value={a['value']!r} "
              f"prims={[(f, v, off) for f, w, v, off in a['prim_offsets']]} item={a['item_fields']}")


if __name__ == "__main__":
    dump(sys.argv[1])
