#!/usr/bin/env python3
"""Write LOG entries (_data/logs/<uuid>.json) from platform status changes in _data/works.

Usage: auto_log.py BEFORE AFTER [--dry-run]

Only the platform list is compared (name + safety identify a platform, status is what changes).
Text, link and image edits produce nothing. A work only gets a "새 작품" entry once one of its
platforms is 공개 중, so registering a work before launch stays quiet.
"""
import datetime
import json
import os
import subprocess
import sys
import uuid

WORKS = '_data/works'
LOGS = '_data/logs'
PUBLIC = '공개 중'
NAMESPACE = uuid.UUID('6f1c1d3e-8f0a-4c51-9d55-3a9b8f0e2c71')
KST = datetime.timezone(datetime.timedelta(hours=9))


def git(*args):
    return subprocess.run(['git', *args], check=True, capture_output=True, text=True).stdout


def load_works(ref):
    works = {}
    for path in git('ls-tree', '--name-only', f'{ref}:{WORKS}').split():
        if not path.endswith('.json'):
            continue
        try:
            work = json.loads(git('show', f'{ref}:{WORKS}/{path}'))
        except (subprocess.CalledProcessError, json.JSONDecodeError):
            continue
        if isinstance(work, dict) and work.get('id') and work.get('name'):
            works[work['id']] = work
    return works


def platforms(work):
    out = []
    for p in work.get('platforms') or []:
        if isinstance(p, dict) and p.get('name'):
            safety = '/'.join(p.get('safety') or [])
            out.append(((p['name'], safety), p.get('status') or ''))
    return out


def label(key):
    return ' '.join(part for part in key if part)


def is_public(work):
    return any(status == PUBLIC for _, status in platforms(work))


def platform_event(key, old, new):
    name = label(key)
    if new == old:
        return None
    if new == PUBLIC:
        if old is None:
            return f'{name} 추가 공개', '공개'
        return (f'{name} 리뉴얼 공개', '리뉴얼 완료') if old == '리뉴얼 예정' else (f'{name} 공개', '공개')
    if new in ('리뉴얼 예정', '제작 중', '공개 중단'):
        return f'{name} {new}', new
    return None


def entries(before, after):
    for work_id, work in after.items():
        old_work = before.get(work_id)
        if is_public(work) and (old_work is None or not is_public(old_work)):
            launched = [label(k) for k, s in platforms(work) if s == PUBLIC]
            yield work, f'새 작품 {work["name"]} 공개', '제작 소식', '새 작품', ' · '.join(launched) + ' 공개'
            continue
        if old_work is None or not (is_public(work) or is_public(old_work)):
            continue
        old = {}
        for key, status in platforms(old_work):
            old.setdefault(key, status)
        events = [e for e in (platform_event(k, old.get(k), s) for k, s in platforms(work)) if e]
        if len(events) == 1:
            text, tag = events[0]
            yield work, f'{work["name"]} · {text}', '업데이트', tag, ''
        elif events:
            yield work, f'{work["name"]} 업데이트', '업데이트', '', '\n'.join(text for text, _ in events)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    before_ref, after_ref, dry = sys.argv[1], sys.argv[2], '--dry-run' in sys.argv
    if set(before_ref) <= {'0'}:
        print('No previous commit to compare; nothing to do.')
        return
    try:
        git('cat-file', '-e', f'{before_ref}^{{commit}}')
    except subprocess.CalledProcessError:
        print(f'Commit {before_ref} is not available; nothing to do.')
        return
    committed = datetime.datetime.fromisoformat(git('show', '-s', '--format=%cI', after_ref).strip())
    date = committed.astimezone(KST).strftime('%Y-%m-%d')
    count = 0
    for work, title, category, tag, body in entries(load_works(before_ref), load_works(after_ref)):
        # Same commit + work always gives the same id, so a re-run overwrites instead of duplicating.
        log_id = str(uuid.uuid5(NAMESPACE, f'{after_ref}:{work["id"]}'))
        record = {'id': log_id, 'date': date, 'title': title, 'category': category}
        if tag:
            record['tag'] = tag
        if body:
            record['body'] = body
        record['visible'] = True
        print(('[dry-run] ' if dry else '') + json.dumps(record, ensure_ascii=False))
        count += 1
        if not dry:
            os.makedirs(LOGS, exist_ok=True)
            with open(os.path.join(LOGS, log_id + '.json'), 'w', encoding='utf-8') as f:
                json.dump(record, f, ensure_ascii=False, indent=2)
                f.write('\n')
    print(f'{count} log entr{"y" if count == 1 else "ies"}.')


if __name__ == '__main__':
    main()
