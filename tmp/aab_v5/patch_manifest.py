"""Patch the aapt2 proto AndroidManifest.xml inside the Fork-Fate .aab:
1. DELETE the TWA meta-data <meta-data android:name=
   "android.support.customtabs.trusted.SCREEN_ORIENTATION"> element — this is
   the portrait lock behind Google Play's large-screen orientation advisory
   (the Android manifest itself has NO android:screenOrientation attribute).
2. Bump versionCode 4 -> 5 (Play requires a fresh versionCode per upload).

Full parse -> mutate -> re-serialize using the aapt2 XmlNode schema:
  XmlNode     { element=1 (XmlElement) | text=2; source=3 }
  XmlElement  { ns_decl=1; namespace_uri=2; name=3; attribute=4 rep; child=5 rep }
  XmlAttribute{ namespace_uri=1; name=2; value=3; source=4; resource_id=5; compiled_item=6 }
  Item        { ref=1; str=2; ...; prim=7 }   Primitive { int_decimal_value=6; ... }
Unknown / uninteresting fields are copied through verbatim.
"""
import sys

ORIENT_META = b"android.support.customtabs.trusted.SCREEN_ORIENTATION"


def read_varint(buf, pos):
    result, shift = 0, 0
    while True:
        b = buf[pos]
        result |= (b & 0x7F) << shift
        pos += 1
        if not (b & 0x80):
            return result, pos
        shift += 7


def write_varint(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def parse_fields(buf, start, end):
    """-> list of [field, wiretype, payload] where payload is raw bytes for
    wt==2 (WITHOUT length prefix), int for wt==0, raw bytes for wt==1/5."""
    fields, pos = [], start
    while pos < end:
        key, pos = read_varint(buf, pos)
        f, wt = key >> 3, key & 7
        if wt == 0:
            v, pos = read_varint(buf, pos)
            fields.append([f, wt, v])
        elif wt == 2:
            ln, pos = read_varint(buf, pos)
            fields.append([f, wt, bytes(buf[pos:pos + ln])])
            pos += ln
        elif wt == 5:
            fields.append([f, wt, bytes(buf[pos:pos + 4])]); pos += 4
        elif wt == 1:
            fields.append([f, wt, bytes(buf[pos:pos + 8])]); pos += 8
        else:
            raise ValueError(f"wiretype {wt}")
    return fields


def serialize_fields(fields):
    out = bytearray()
    for f, wt, payload in fields:
        out += write_varint((f << 3) | wt)
        if wt == 0:
            out += write_varint(payload)
        elif wt == 2:
            out += write_varint(len(payload)) + payload
        else:
            out += payload
    return bytes(out)


def get_str(fields, fno):
    for f, wt, p in fields:
        if f == fno and wt == 2:
            return p
    return None


def attr_matches(attr_bytes, name, value=None):
    fields = parse_fields(attr_bytes, 0, len(attr_bytes))
    if get_str(fields, 2) != name:
        return False
    return value is None or get_str(fields, 3) == value


def element_is_orientation_meta(elem_bytes):
    fields = parse_fields(elem_bytes, 0, len(elem_bytes))
    if get_str(fields, 3) != b"meta-data":
        return False
    for f, wt, p in fields:
        if f == 4 and wt == 2 and attr_matches(p, b"name", ORIENT_META):
            return True
    return False


def patch_version_code(attr_bytes):
    """versionCode attribute: value string '4'->'5' and Primitive int 4->5."""
    fields = parse_fields(attr_bytes, 0, len(attr_bytes))
    changed = False
    for fld in fields:
        f, wt, p = fld
        if f == 3 and wt == 2 and p == b"4":
            fld[2] = b"5"; changed = True
        elif f == 6 and wt == 2:  # Item
            item = parse_fields(p, 0, len(p))
            for it in item:
                if it[0] == 7 and it[1] == 2:  # Primitive
                    prim = parse_fields(it[2], 0, len(it[2]))
                    for pr in prim:
                        if pr[0] == 6 and pr[1] == 0 and pr[2] == 4:
                            pr[2] = 5; changed = True
                    it[2] = serialize_fields(prim)
            fld[2] = serialize_fields(item)
    return serialize_fields(fields), changed


STATS = {"meta_removed": 0, "vc_patched": 0}


def rewrite_element(elem_bytes):
    fields = parse_fields(elem_bytes, 0, len(elem_bytes))
    name = get_str(fields, 3)
    out = []
    for f, wt, p in fields:
        if f == 5 and wt == 2:  # child XmlNode
            node = parse_fields(p, 0, len(p))
            drop = False
            for nf in node:
                if nf[0] == 1 and nf[1] == 2:  # element
                    if element_is_orientation_meta(nf[2]):
                        drop = True
                    else:
                        nf[2] = rewrite_element(nf[2])
            if drop:
                STATS["meta_removed"] += 1
                continue
            out.append([f, wt, serialize_fields(node)])
        elif f == 4 and wt == 2 and name == b"manifest" and attr_matches(p, b"versionCode"):
            patched, ok = patch_version_code(p)
            if ok:
                STATS["vc_patched"] += 1
            out.append([f, wt, patched])
        else:
            out.append([f, wt, p])
    return serialize_fields(out)


def main(src, dst):
    buf = open(src, "rb").read()
    root = parse_fields(buf, 0, len(buf))
    for rf in root:
        if rf[0] == 1 and rf[1] == 2:  # root XmlNode.element
            rf[2] = rewrite_element(rf[2])
    out = serialize_fields(root)
    open(dst, "wb").write(out)
    print(f"meta-data removed: {STATS['meta_removed']}, versionCode patched: {STATS['vc_patched']}")
    print(f"size {len(buf)} -> {len(out)}")
    assert STATS["meta_removed"] == 1, "expected exactly one SCREEN_ORIENTATION meta-data"
    assert STATS["vc_patched"] == 1, "expected exactly one versionCode patch"


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
