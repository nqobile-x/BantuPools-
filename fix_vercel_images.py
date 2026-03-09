import os
import re
import subprocess

def normalize_name(name):
    base, ext = os.path.splitext(name)
    base = base.lower()
    base = re.sub(r'[^a-z0-9]+', '-', base)
    base = base.strip('-')
    return base + ext.lower()

html_files = ["index.html", "services.html"]

for root, dirs, files in os.walk("Images"):
    for filename in files:
        if not filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')):
            continue

        old_name = filename
        new_name = normalize_name(filename)
        
        if old_name == new_name:
            continue

        old_path = os.path.join(root, old_name).replace('\\', '/')
        new_path = os.path.join(root, new_name).replace('\\', '/')

        print(f"Renaming {old_path} -> {new_path}")
        os.rename(old_path, new_path)

        old_url_encoded = old_name.replace(" ", "%20")
        
        for html_file in html_files:
            if not os.path.exists(html_file): continue
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content = content.replace(f"Images/{old_url_encoded}", f"Images/{new_name}")
            content = content.replace(f"Images/{old_name}", f"Images/{new_name}")
            content = content.replace(f"Images/Logo/{old_url_encoded}", f"Images/Logo/{new_name}")
            content = content.replace(f"Images/Logo/{old_name}", f"Images/Logo/{new_name}")
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)

subprocess.run(["git", "add", "-A"])
print("Done processing images.")
