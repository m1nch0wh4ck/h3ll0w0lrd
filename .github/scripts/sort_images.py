#!/usr/bin/env python3
"""Keep assets/images sorted by work.

Pages CMS uploads into whichever folder is open in its image window, usually the top level.
After a work is saved, this moves each top-level image the work uses into
assets/images/works/<주소용 이름>/ (cover), .../gallery/, .../secret/, .../persona/ or .../profile/
and rewrites the paths in the work's JSON. File names are never changed.

If a JSON points at a file that is no longer where it says (for example a CMS form that was
open during the move was saved again), and a file with the same name exists elsewhere under
assets/images, the path is pointed at that file.

Usage: sort_images.py [--dry-run]
"""
import glob
import json
import os
import re
import sys

ROOT = 'assets/images'
BASE = '/h3ll0w0lrd/assets/images/'
WORKS = '_data/works'


def main():
    dry = '--dry-run' in sys.argv
    moves = {}  # top-level file name -> path under ROOT

    def plan(url, dest):
        if isinstance(url, str) and url.startswith(BASE):
            name = url[len(BASE):]
            if '/' not in name and os.path.isfile(os.path.join(ROOT, name)):
                moves.setdefault(name, dest + '/' + name)

    files = sorted(glob.glob(WORKS + '/*.json'))
    for path in files:
        try:
            work = json.load(open(path, encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(work, dict) or not re.fullmatch(r'[a-z0-9-]+', str(work.get('id') or '')):
            continue
        folder = 'works/' + work['id']
        plan(work.get('image'), folder)
        for url in work.get('gallery') or []:
            plan(url, folder + '/gallery')
        for url in work.get('secretGallery') or []:
            plan(url, folder + '/secret')
        for key, sub in (('personas', 'persona'), ('profiles', 'profile')):
            for item in work.get(key) or []:
                if isinstance(item, dict):
                    plan(item.get('image'), folder + '/' + sub)

    for old, new in moves.items():
        print(('[dry-run] ' if dry else '') + f'move {old} -> {new}')
        if not dry:
            os.makedirs(os.path.dirname(os.path.join(ROOT, new)), exist_ok=True)
            os.replace(os.path.join(ROOT, old), os.path.join(ROOT, new))

    # Where every image is now, by file name (after the planned moves).
    where = {}
    for found in glob.glob(ROOT + '/**/*', recursive=True):
        if os.path.isfile(found):
            where.setdefault(os.path.basename(found), []).append(os.path.relpath(found, ROOT))
    for old, new in moves.items():
        if dry:
            where[old] = [new]

    rewritten = 0
    for path in files:
        text = open(path, encoding='utf-8').read()

        def fix(match):
            rel = match.group(1)
            if rel in moves:
                return BASE + moves[rel]
            if os.path.isfile(os.path.join(ROOT, rel)) and not dry:
                return match.group(0)
            spots = where.get(os.path.basename(rel)) or []
            if len(spots) == 1 and spots[0] != rel:
                print(('[dry-run] ' if dry else '') + f'repoint {rel} -> {spots[0]} ({os.path.basename(path)})')
                return BASE + spots[0]
            return match.group(0)

        new_text = re.sub(re.escape(BASE) + r'([^"\\]+)', fix, text)
        if new_text != text:
            rewritten += 1
            if not dry:
                open(path, 'w', encoding='utf-8').write(new_text)
    print(f'{len(moves)} image(s) moved, {rewritten} work file(s) updated.')


if __name__ == '__main__':
    main()
