# Fails if a name from the private list appears under src/ or public/.
# The list is never printed. A hit is only "path:line".
import os, sys, re

ROOT = os.path.dirname(os.path.abspath(__file__))
TEXT = {".html", ".json", ".css", ".js", ".ts", ".astro", ".md", ".py", ".txt", ".svg", ".mjs"}


def names_from(path):
    if not path or not os.path.isfile(path):
        print("namecheck: name list missing", file=sys.stderr)
        raise SystemExit(2)
    found = []
    for line in open(path, encoding="utf-8"):
        text = line.strip()
        if not text or text.startswith("#"):
            continue
        found.append(text)
    if not found:
        print("namecheck: name list empty", file=sys.stderr)
        raise SystemExit(2)
    return found


def norm(text):
    return re.sub(r"[\u0591-\u05C7]", "", text).replace("״", '"').replace("׳", "'").lower()


def scan_roots(list_path, roots):
    needles = [(name, norm(name)) for name in names_from(list_path)]
    hits = []
    for root in roots:
        if not os.path.isdir(root):
            continue
        for directory, _, files in os.walk(root):
            for filename in files:
                path = os.path.join(directory, filename)
                rel = os.path.relpath(path, ROOT)
                file_norm = norm(rel)
                for _, needle in needles:
                    if needle and needle in file_norm:
                        hits.append(f"{rel}:1")
                        break
                extension = os.path.splitext(filename)[1].lower()
                if extension not in TEXT:
                    continue
                try:
                    lines = open(path, encoding="utf-8", errors="ignore").read().splitlines()
                except OSError:
                    continue
                for number, line in enumerate(lines, start=1):
                    haystack = norm(line)
                    for _, needle in needles:
                        if needle and needle in haystack:
                            hits.append(f"{rel}:{number}")
                            break
    return hits


def main():
    args = sys.argv[1:]
    list_path = ""
    roots = [os.path.join(ROOT, "src"), os.path.join(ROOT, "public")]
    index = 0
    while index < len(args):
        if args[index] == "--root" and index + 1 < len(args):
            roots = [args[index + 1]]
            index += 2
            continue
        list_path = args[index]
        index += 1
    if not list_path:
        list_path = os.environ.get("ZAN_REALNAMES", "")
    hits = scan_roots(list_path, roots)
    if hits:
        for hit in hits:
            print(hit)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
