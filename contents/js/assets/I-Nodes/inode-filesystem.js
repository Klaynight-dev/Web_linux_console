/**
 * Système de fichiers basé sur les I-Nodes pour la console Linux web
 * Permet aux fichiers d'être présents dans plusieurs dossiers
 */

class INodeFileSystem {
    constructor() {
        // Table des I-Nodes (stockage central des fichiers/dossiers)
        this.inodes = new Map();
        
        // Compteur pour les nouveaux I-Nodes
        this.nextInodeId = 1;
        
        // Structure des dossiers (stocke les noms et références vers les I-Nodes)
        this.directories = new Map();
        
        // Initialiser le système par défaut
        this.initializeDefaultSystem();
    }

    /**
     * Initialise le système de fichiers par défaut
     */
    initializeDefaultSystem() {
        // Créer l'I-Node racine et l'incrémenter pour éviter les conflits
        const rootInode = this.createINode('directory', {});
        rootInode.linkCount = 1; // Le dossier racine a toujours au moins un lien
        
        // Configurer la structure du dossier racine
        this.directories.set(rootInode.id, new Map([
            ['.', rootInode.id],
            ['..', rootInode.id]
        ]));

        // Créer les dossiers de base
        const binDir = this.createDirectory();
        const homeDir = this.createDirectory();
        const etcDir = this.createDirectory();
        
        // Ajouter les dossiers à la racine
        this.addToDirectory('/', 'bin', binDir.id);
        this.addToDirectory('/', 'home', homeDir.id);
        this.addToDirectory('/', 'etc', etcDir.id);

        // Créer le dossier user dans home
        const userDir = this.createDirectory();
        this.addToDirectory('/home', 'user', userDir.id);

        // Créer des fichiers d'exemple
        const welcomeFile = this.createFile('Bienvenue sur votre console Linux web!');
        const notesFile = this.createFile('Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.');
        
        // Ajouter les fichiers au dossier user
        this.addToDirectory('/home/user', 'welcome.txt', welcomeFile.id);
        this.addToDirectory('/home/user', 'notes.txt', notesFile.id);

        // Créer le fichier motd avec contenu dynamique
        const motdFile = this.createFile(this.getMotdContent());
        this.addToDirectory('/etc', 'motd', motdFile.id);
    }

    /**
     * Crée un nouvel I-Node
     */
    createINode(type, data) {
        const inodeId = this.nextInodeId++;
        const inode = {
            id: inodeId,
            type: type, // 'file' ou 'directory'
            data: data, // contenu pour fichier, {} pour dossier
            linkCount: 0, // nombre de liens durs vers cet I-Node
            created: new Date(),
            modified: new Date(),
            accessed: new Date()
        };
        
        this.inodes.set(inodeId, inode);
        return inode;
    }

    /**
     * Crée un nouveau fichier et retourne son I-Node
     */
    createFile(content = '') {
        return this.createINode('file', content);
    }

    /**
     * Crée un nouveau dossier et retourne son I-Node
     */
    createDirectory() {
        const dirInode = this.createINode('directory', {});
        
        // Initialiser la structure du dossier
        this.directories.set(dirInode.id, new Map([
            ['.', dirInode.id],
            ['..', null] // sera défini lors de l'ajout à un parent
        ]));
        
        return dirInode;
    }

    /**
     * Ajoute une entrée (fichier ou dossier) à un dossier
     */
    addToDirectory(dirPath, name, inodeId, force = false) {
        const dirInode = this.getInodeByPath(dirPath);
        if (!dirInode || dirInode.type !== 'directory') {
            throw new Error(`Le chemin ${dirPath} n'est pas un dossier valide`);
        }

        const dirEntries = this.directories.get(dirInode.id);
        if (!dirEntries) {
            throw new Error(`Structure de dossier corrompue pour ${dirPath}`);
        }

        // Vérifier si le nom existe déjà (sauf si force=true)
        if (!force && dirEntries.has(name)) {
            throw new Error(`Le fichier ou dossier "${name}" existe déjà dans ${dirPath}`);
        }

        // Si force=true et le fichier existe, supprimer l'ancien d'abord
        if (force && dirEntries.has(name)) {
            const oldInodeId = dirEntries.get(name);
            const oldInode = this.inodes.get(oldInodeId);
            if (oldInode) {
                oldInode.linkCount--;
                if (oldInode.linkCount === 0) {
                    this.inodes.delete(oldInodeId);
                    if (oldInode.type === 'directory') {
                        this.directories.delete(oldInodeId);
                    }
                }
            }
        }

        // Ajouter l'entrée
        dirEntries.set(name, inodeId);
        
        // Incrémenter le compteur de liens
        const targetInode = this.inodes.get(inodeId);
        if (targetInode) {
            targetInode.linkCount++;
            targetInode.modified = new Date();
        }

        // Si c'est un dossier, configurer le parent (..)
        if (targetInode && targetInode.type === 'directory') {
            const targetDirEntries = this.directories.get(inodeId);
            if (targetDirEntries) {
                targetDirEntries.set('..', dirInode.id);
            }
        }
    }

    /**
     * Supprime une entrée d'un dossier
     */
    removeFromDirectory(dirPath, name) {
        const dirInode = this.getInodeByPath(dirPath);
        if (!dirInode || dirInode.type !== 'directory') {
            throw new Error(`Le chemin ${dirPath} n'est pas un dossier valide`);
        }

        const dirEntries = this.directories.get(dirInode.id);
        if (!dirEntries || !dirEntries.has(name)) {
            throw new Error(`Le fichier ou dossier "${name}" n'existe pas dans ${dirPath}`);
        }

        const inodeId = dirEntries.get(name);
        const targetInode = this.inodes.get(inodeId);
        
        // Supprimer l'entrée du dossier
        dirEntries.delete(name);
        
        // Décrémenter le compteur de liens
        if (targetInode) {
            targetInode.linkCount--;
            
            // Si plus aucun lien, supprimer l'I-Node
            if (targetInode.linkCount === 0) {
                this.inodes.delete(inodeId);
                
                // Si c'était un dossier, supprimer sa structure
                if (targetInode.type === 'directory') {
                    this.directories.delete(inodeId);
                }
            }
        }
    }

    /**
     * Crée un lien dur vers un fichier existant
     */
    createHardLink(sourcePath, targetDirPath, linkName) {
        const sourceInode = this.getInodeByPath(sourcePath);
        if (!sourceInode) {
            throw new Error(`Le fichier source ${sourcePath} n'existe pas`);
        }

        if (sourceInode.type === 'directory') {
            throw new Error('Impossible de créer un lien dur vers un dossier');
        }

        // Ajouter le lien dans le dossier cible
        this.addToDirectory(targetDirPath, linkName, sourceInode.id);
    }

    /**
     * Récupère l'I-Node à partir d'un chemin
     */
    getInodeByPath(path) {
        if (path === '/') {
            // Trouver l'I-Node racine
            for (const [inodeId, entries] of this.directories.entries()) {
                if (entries.get('.') === inodeId && entries.get('..') === inodeId) {
                    return this.inodes.get(inodeId);
                }
            }
            return null;
        }

        const parts = path.split('/').filter(p => p !== '');
        let currentInode = this.getInodeByPath('/'); // Commencer à la racine
        
        for (const part of parts) {
            if (!currentInode || currentInode.type !== 'directory') {
                return null;
            }

            const dirEntries = this.directories.get(currentInode.id);
            if (!dirEntries || !dirEntries.has(part)) {
                return null;
            }

            const nextInodeId = dirEntries.get(part);
            currentInode = this.inodes.get(nextInodeId);
        }

        return currentInode;
    }

    /**
     * Liste le contenu d'un dossier
     */
    listDirectory(path) {
        const dirInode = this.getInodeByPath(path);
        if (!dirInode || dirInode.type !== 'directory') {
            throw new Error(`${path} n'est pas un dossier`);
        }

        const dirEntries = this.directories.get(dirInode.id);
        const result = [];

        for (const [name, inodeId] of dirEntries.entries()) {
            if (name === '.' || name === '..') continue;
            
            const inode = this.inodes.get(inodeId);
            if (inode) {
                result.push({
                    name: name,
                    type: inode.type,
                    inodeId: inode.id,
                    linkCount: inode.linkCount,
                    size: inode.type === 'file' ? inode.data.length : 0,
                    created: inode.created,
                    modified: inode.modified
                });
            }
        }

        return result;
    }

    /**
     * Lit le contenu d'un fichier
     */
    readFile(path) {
        const fileInode = this.getInodeByPath(path);
        if (!fileInode) {
            throw new Error(`Le fichier ${path} n'existe pas`);
        }
        
        if (fileInode.type !== 'file') {
            throw new Error(`${path} n'est pas un fichier`);
        }

        // Mettre à jour l'heure d'accès
        fileInode.accessed = new Date();
        
        return fileInode.data;
    }

    /**
     * Écrit dans un fichier
     */
    writeFile(path, content) {
        const fileInode = this.getInodeByPath(path);
        if (!fileInode) {
            throw new Error(`Le fichier ${path} n'existe pas`);
        }
        
        if (fileInode.type !== 'file') {
            throw new Error(`${path} n'est pas un fichier`);
        }

        fileInode.data = content;
        fileInode.modified = new Date();
        fileInode.accessed = new Date();
    }

    /**
     * Trouve tous les chemins qui pointent vers un I-Node donné
     */
    findAllPathsToInode(inodeId) {
        const paths = [];
        
        // Parcourir tous les dossiers pour trouver les références
        for (const [dirInodeId, entries] of this.directories.entries()) {
            for (const [name, entryInodeId] of entries.entries()) {
                if (entryInodeId === inodeId && name !== '.' && name !== '..') {
                    // Reconstituer le chemin complet de ce dossier
                    const dirPath = this.getPathForInode(dirInodeId);
                    if (dirPath) {
                        paths.push(dirPath === '/' ? `/${name}` : `${dirPath}/${name}`);
                    }
                }
            }
        }
        
        return paths;
    }

    /**
     * Reconstitue le chemin complet pour un I-Node de dossier
     */
    getPathForInode(inodeId) {
        if (!this.inodes.has(inodeId)) return null;
        
        const parts = [];
        let currentInodeId = inodeId;
        
        while (true) {
            const dirEntries = this.directories.get(currentInodeId);
            if (!dirEntries) break;
            
            const parentInodeId = dirEntries.get('..');
            if (!parentInodeId || parentInodeId === currentInodeId) {
                // C'est la racine
                break;
            }
            
            // Trouver le nom de ce dossier dans son parent
            const parentEntries = this.directories.get(parentInodeId);
            if (parentEntries) {
                for (const [name, id] of parentEntries.entries()) {
                    if (id === currentInodeId && name !== '.' && name !== '..') {
                        parts.unshift(name);
                        break;
                    }
                }
            }
            
            currentInodeId = parentInodeId;
        }
        
        return parts.length === 0 ? '/' : '/' + parts.join('/');
    }

    /**
     * Affiche les statistiques d'un I-Node
     */
    statInode(path) {
        const inode = this.getInodeByPath(path);
        if (!inode) {
            throw new Error(`${path} n'existe pas`);
        }

        const allPaths = this.findAllPathsToInode(inode.id);
        
        return {
            inodeId: inode.id,
            type: inode.type,
            linkCount: inode.linkCount,
            allPaths: allPaths,
            size: inode.type === 'file' ? inode.data.length : 0,
            created: inode.created,
            modified: inode.modified,
            accessed: inode.accessed
        };
    }

    /**
     * Exporte le système de fichiers pour sauvegarde
     */
    export() {
        return {
            inodes: Array.from(this.inodes.entries()),
            directories: Array.from(this.directories.entries()).map(([id, entries]) => 
                [id, Array.from(entries.entries())]
            ),
            nextInodeId: this.nextInodeId
        };
    }

    /**
     * Importe un système de fichiers sauvegardé
     */
    import(data) {
        this.inodes = new Map(data.inodes);
        this.directories = new Map(
            data.directories.map(([id, entries]) => [id, new Map(entries)])
        );
        this.nextInodeId = data.nextInodeId;
    }

    /**
     * Génère le contenu dynamique du MOTD
     */
    getMotdContent() {
        const messages = [
            "Message du jour : Amusez-vous bien !",
            "Message du jour : Apprenez quelque chose de nouveau aujourd'hui.",
            "Message du jour : La persévérance paie toujours.",
            "Message du jour : Codez avec passion.",
            "Message du jour : Prenez une pause et respirez.",
            "Message du jour : La curiosité est une qualité.",
            "Message du jour : Essayez une nouvelle commande.",
            "Message du jour : Partagez vos connaissances.",
            "Message du jour : La simplicité est la sophistication suprême.",
            "Message du jour : Un bug aujourd'hui, une solution demain."
        ];
        
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        return messages[dayOfYear % messages.length];
    }
}

// Export en tant que module ES6
export default INodeFileSystem;
