import os

def normalize_name(name):
    # Standard mapping for these specific files
    mapping = {
        "Bantu Pools Flyer.png": "bantu-pools-flyer.png",
        "Bantu Pools Pool clean.png": "bantu-pools-clean.png",
        "Bantu Pools.png": "bantu-pools-hero.png",
        "Dirty Pool.png": "dirty-pool-before.png",
        "Pool Construction.png": "pool-construction.png",
        "Reno _pool.png": "reno-pool-resurfacing.png",
        "Renovation.png": "pool-renovation.png",
        "Renovations_pool.png": "pool-renovations-detail.png",
        "Scrub Clean.png": "scrub-clean.png",
        "repairs_and_maintainance.png": "pool-repairs.png",
        "Bantu pools  Logo.png": "bantu-pools-logo.png"
    }
    return mapping.get(name, name.lower().replace(" ", "-"))

images_dir = r"c:\Users\nqobile\Desktop\Bantu Pools\Images"

for root, dirs, files in os.walk(images_dir):
    for f in files:
        old_path = os.path.join(root, f)
        new_name = normalize_name(f)
        new_path = os.path.join(root, new_name)
        if old_path != new_path:
            print(f"Renaming {f} -> {new_name}")
            if os.path.exists(new_path):
                os.remove(new_path)
            os.rename(old_path, new_path)
