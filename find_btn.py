import os

keywords = ['ArrowUp', 'ChevronUp', 'scrollTop', 'a.bottom_', 'bottom_left', 'a.left_', 'newItems', 'hasNew']

for root, dirs, files in os.walk('src'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git')]
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        try:
            content = open(path, encoding='utf-8', errors='ignore').read()
            for kw in keywords:
                if kw in content:
                    lines = [(i+1, l.strip()) for i, l in enumerate(content.split('\n')) if kw in l]
                    for lineno, line in lines[:3]:
                        print(f'{path}:{lineno}: {line[:120]}')
        except Exception:
            pass
