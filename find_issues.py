import os

keywords = ['scrollToTop', 'ArrowUp', 'borderLeft', 'borderRight', 'scrollbar']

for root, dirs, files in os.walk('src'):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        try:
            content = open(path, encoding='utf-8', errors='ignore').read()
            for kw in keywords:
                if kw in content:
                    lines = [(i+1, l.strip()) for i, l in enumerate(content.split('\n')) if kw in l]
                    for lineno, line in lines[:2]:
                        print(f'{path}:{lineno}: {line[:100]}')
        except Exception:
            pass
