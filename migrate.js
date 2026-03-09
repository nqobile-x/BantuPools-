const fs = require('fs');
const path = require('path');

function normalizeName(name) {
    let parsed = path.parse(name);
    let base = parsed.name.toLowerCase();
    base = base.replace(/[^a-z0-9]+/g, '-');
    base = base.replace(/^-+|-+$/g, '');
    return base + parsed.ext.toLowerCase();
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, path.join(dest, entry.name.toLowerCase()));
        } else if (entry.isFile() && /\.(png|jpe?g|gif|svg|webp)$/i.test(entry.name)) {
            const newName = normalizeName(entry.name);
            const destPath = path.join(dest, newName);
            console.log(`Copying ${srcPath} to ${destPath}`);
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyDirectory('Images', 'assets');

const htmlFiles = ['index.html', 'services.html'];
htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // This regex matches Images/... .png and lets us replace it
        // It's easier just to manually re-map them since there's 10 files
        const map = {
            'Logo/Bantu pools  Logo.png': 'assets/logo/bantu-pools-logo.png',
            'Bantu Pools Flyer.png': 'assets/bantu-pools-flyer.png',
            'Bantu Pools Pool clean.png': 'assets/bantu-pools-pool-clean.png',
            'Bantu Pools.png': 'assets/bantu-pools.png',
            'Dirty Pool.png': 'assets/dirty-pool.png',
            'Pool Construction.png': 'assets/pool-construction.png',
            'Reno _pool.png': 'assets/reno-pool.png',
            'Renovation.png': 'assets/renovation.png',
            'Renovations_pool.png': 'assets/renovations-pool.png',
            'Scrub Clean.png': 'assets/scrub-clean.png',
            'repairs_and_maintainance.png': 'assets/repairs-and-maintainance.png'
        };

        for (const [oldName, newPath] of Object.entries(map)) {
            const encoded = oldName.replace(/ /g, '%20');
            content = content.split(`Images/${encoded}`).join(newPath);
            content = content.split(`Images/${oldName}`).join(newPath);
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
