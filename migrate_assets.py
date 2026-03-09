import os
import shutil
import re
import subprocess

def normalize_name(name):
    base, ext = os.path.splitext(name)
    base = base.lower()
    base = re.sub(r'[^a-z0-9]+', '-', base)
    base = base.strip('-')
    return base + ext.lower()

os.makedirs('assets', exist_ok=True)
os.makedirs('assets/logo', exist_ok=True)

html_files = ["index.html", "services.html"]

for root, dirs, files in os.walk("Images"):
    for filename in files:
        if not filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')):
            continue

        old_name = filename
        new_name = normalize_name(filename)
        
        old_path = os.path.join(root, old_name).replace('\\', '/')
        
        # determine new path
        if 'Logo' in root:
            new_path = os.path.join('assets/logo', new_name).replace('\\', '/')
            new_html_path = f"assets/logo/{new_name}"
        else:
            new_path = os.path.join('assets', new_name).replace('\\', '/')
            new_html_path = f"assets/{new_name}"

        print(f"Copying {old_path} -> {new_path}")
        shutil.copy2(old_path, new_path)

        old_url_encoded = old_name.replace(" ", "%20")
        
        for html_file in html_files:
            if not os.path.exists(html_file): continue
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace case-sensitive permutations
            content = content.replace(f"Images/Logo/{old_url_encoded}", new_html_path)
            content = content.replace(f"Images/Logo/{old_name}", new_html_path)
            content = content.replace(f"Images/{old_url_encoded}", new_html_path)
            content = content.replace(f"Images/{old_name}", new_html_path)
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)

print("Copy and HTML replacement complete. Removing old Images directory from git...")
subprocess.run("git rm -r Images", shell=True)
subprocess.run("git add assets index.html services.html", shell=True)
print("Done.")
