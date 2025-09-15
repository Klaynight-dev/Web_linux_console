// Importer INodeFileSystem
import INodeFileSystem from './inode-filesystem.js';

/**
 * Adaptateur pour intégrer le système I-Node dans l'application Console Linux
 * Fait le pont entre l'ancien système de fichiers et le nouveau système I-Node
 */

class INodeAdapter {
    constructor(app) {
        this.app = app;
        this.inodeFS = new INodeFileSystem();
        
        // Migrer l'ancien système de fichiers si nécessaire
        this.migrateFromLegacyFileSystem();
    }

    /**
     * Migre l'ancien système de fichiers vers le système I-Node
     */
    migrateFromLegacyFileSystem() {
        if (!this.app.fileSystem) return;
        
        try {
            this.migrateFSNode('/', this.app.fileSystem['/']);
            console.log('✅ Migration du système de fichiers terminée');
        } catch (error) {
            console.error('❌ Erreur lors de la migration:', error);
        }
    }

    /**
     * Migre récursivement un noeud du système de fichiers
     */
    migrateFSNode(path, node) {
        if (!node || typeof node !== 'object') return;

        if (node.type === 'directory' && node.children) {
            // Créer le dossier s'il n'existe pas déjà
            if (path !== '/') {
                const pathParts = path.split('/').filter(p => p !== '');
                const dirName = pathParts.pop();
                const parentPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
                
                const existingInode = this.inodeFS.getInodeByPath(path);
                if (!existingInode) {
                    const dirInode = this.inodeFS.createDirectory();
                    this.inodeFS.addToDirectory(parentPath, dirName, dirInode.id);
                }
            }

            // Migrer récursivement les enfants
            for (const [name, child] of Object.entries(node.children)) {
                if (name !== '.' && name !== '..') {
                    const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
                    this.migrateFSNode(childPath, child);
                }
            }
        } else if (node.type === 'file') {
            // Créer le fichier
            const pathParts = path.split('/').filter(p => p !== '');
            const fileName = pathParts.pop();
            const parentPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
            
            const existingInode = this.inodeFS.getInodeByPath(path);
            if (!existingInode) {
                const fileInode = this.inodeFS.createFile(node.content || '');
                this.inodeFS.addToDirectory(parentPath, fileName, fileInode.id);
            }
        }
    }

    /**
     * Récupère les informations d'un nœud
     */
    getNodeInfo(path) {
        try {
            const inode = this.inodeFS.getInodeByPath(path);
            if (!inode) return null;
            
            return {
                type: inode.type,
                size: inode.type === 'file' ? inode.data.length : 0,
                linkCount: inode.linkCount,
                created: inode.created,
                modified: inode.modified,
                inodeId: inode.id
            };
        } catch (error) {
            console.error('Erreur getNodeInfo:', error);
            return null;
        }
    }

    /**
     * Déplace un fichier ou dossier
     */
    moveNode(sourcePath, destPath) {
        try {
            // Vérifier que la source existe
            const sourceInode = this.inodeFS.getInodeByPath(sourcePath);
            if (!sourceInode) {
                throw new Error('Source non trouvée');
            }

            // Obtenir les informations de la source
            const sourcePathParts = sourcePath.split('/').filter(p => p !== '');
            const sourceName = sourcePathParts.pop();
            const sourceParentPath = sourcePathParts.length > 0 ? '/' + sourcePathParts.join('/') : '/';

            // Obtenir les informations de la destination
            const destPathParts = destPath.split('/').filter(p => p !== '');
            const destName = destPathParts.pop();
            const destParentPath = destPathParts.length > 0 ? '/' + destPathParts.join('/') : '/';

            // Vérifier que le répertoire parent de destination existe
            const destParentInode = this.inodeFS.getInodeByPath(destParentPath);
            if (!destParentInode || destParentInode.type !== 'directory') {
                throw new Error('Répertoire parent de destination non trouvé');
            }

            // Vérifier qu'on ne déplace pas vers le même endroit
            if (sourceParentPath === destParentPath && sourceName === destName) {
                throw new Error('Source et destination identiques');
            }

            // IMPORTANT: Ajouter d'abord au nouvel emplacement
            // Cela incrémente le linkCount AVANT de le décrémenter
            // Utiliser force=true pour permettre l'écrasement en cas de déplacement
            this.inodeFS.addToDirectory(destParentPath, destName, sourceInode.id, true);
            
            // Puis supprimer de l'ancien emplacement
            this.inodeFS.removeFromDirectory(sourceParentPath, sourceName);
            
            return true;
        } catch (error) {
            console.error('Erreur moveNode:', error);
            return false;
        }
    }

    /**
     * Crée un nouveau fichier dans le système I-Node
     */
    createFile(dirPath, fileName, content = '') {
        try {
            const fileInode = this.inodeFS.createFile(content);
            this.inodeFS.addToDirectory(dirPath, fileName, fileInode.id);
            return true;
        } catch (error) {
            console.error('Erreur création fichier:', error);
            return false;
        }
    }

    /**
     * Crée un nouveau dossier dans le système I-Node
     */
    createDirectory(parentPath, dirName) {
        try {
            const dirInode = this.inodeFS.createDirectory();
            this.inodeFS.addToDirectory(parentPath, dirName, dirInode.id);
            return true;
        } catch (error) {
            console.error('Erreur création dossier:', error);
            return false;
        }
    }

    /**
     * Supprime un fichier ou dossier
     */
    remove(parentPath, name) {
        try {
            this.inodeFS.removeFromDirectory(parentPath, name);
            return true;
        } catch (error) {
            console.error('Erreur suppression:', error);
            return false;
        }
    }

    /**
     * Lit le contenu d'un fichier
     */
    readFile(path) {
        try {
            return this.inodeFS.readFile(path);
        } catch (error) {
            console.error('Erreur lecture fichier:', error);
            return null;
        }
    }

    /**
     * Écrit dans un fichier
     */
    writeFile(path, content) {
        try {
            this.inodeFS.writeFile(path, content);
            return true;
        } catch (error) {
            console.error('Erreur écriture fichier:', error);
            return false;
        }
    }

    /**
     * Liste le contenu d'un dossier
     */
    listDirectory(path) {
        try {
            return this.inodeFS.listDirectory(path);
        } catch (error) {
            console.error('Erreur listage dossier:', error);
            return [];
        }
    }

    /**
     * Récupère les informations d'un I-Node
     */
    stat(path) {
        try {
            return this.inodeFS.statInode(path);
        } catch (error) {
            console.error('Erreur stat:', error);
            return null;
        }
    }

    /**
     * Crée un lien dur
     */
    createHardLink(sourcePath, targetDirPath, linkName) {
        try {
            this.inodeFS.createHardLink(sourcePath, targetDirPath, linkName);
            return true;
        } catch (error) {
            console.error('Erreur création lien dur:', error);
            return false;
        }
    }

    /**
     * Trouve tous les chemins vers un I-Node
     */
    findAllPathsToInode(inodeId) {
        return this.inodeFS.findAllPathsToInode(inodeId);
    }

    /**
     * Vérifie l'intégrité du système de fichiers
     */
    checkFileSystemIntegrity() {
        const issues = [];
        const warnings = [];
        let checked = 0;

        try {
            // Vérifier tous les I-Nodes
            for (const [inodeId, inode] of this.inodeFS.inodes.entries()) {
                checked++;
                
                // Vérifier la cohérence des liens
                const allPaths = this.findAllPathsToInode(inodeId);
                if (allPaths.length !== inode.linkCount) {
                    warnings.push(`I-Node ${inodeId}: compteur de liens incohérent (${inode.linkCount} vs ${allPaths.length})`);
                }

                // Vérifier les références orphelines
                if (inode.linkCount === 0 && this.inodeFS.inodes.has(inodeId)) {
                    issues.push(`I-Node ${inodeId}: orphelin détecté`);
                }
            }

            // Vérifier les structures de dossiers
            for (const [dirInodeId, entries] of this.inodeFS.directories.entries()) {
                if (!this.inodeFS.inodes.has(dirInodeId)) {
                    issues.push(`Structure de dossier ${dirInodeId}: I-Node manquant`);
                }

                for (const [name, targetInodeId] of entries.entries()) {
                    if (name !== '.' && name !== '..' && !this.inodeFS.inodes.has(targetInodeId)) {
                        issues.push(`Dossier ${dirInodeId}: référence vers I-Node inexistant ${targetInodeId}`);
                    }
                }
            }

        } catch (error) {
            issues.push(`Erreur lors de la vérification: ${error.message}`);
        }

        return { issues, warnings, checked };
    }

    /**
     * Émule l'ancien système getPath pour compatibilité
     */
    getPath(path) {
        try {
            const inode = this.inodeFS.getInodeByPath(path);
            if (!inode) return null;

            if (inode.type === 'file') {
                return {
                    type: 'file',
                    content: inode.data
                };
            } else if (inode.type === 'directory') {
                const children = {};
                const dirEntries = this.inodeFS.directories.get(inode.id);
                
                if (dirEntries) {
                    for (const [name, childInodeId] of dirEntries.entries()) {
                        if (name !== '.' && name !== '..') {
                            const childInode = this.inodeFS.inodes.get(childInodeId);
                            if (childInode) {
                                if (childInode.type === 'file') {
                                    children[name] = {
                                        type: 'file',
                                        content: childInode.data
                                    };
                                } else {
                                    children[name] = {
                                        type: 'directory',
                                        children: {} // Simplifié pour compatibilité
                                    };
                                }
                            }
                        }
                    }
                }

                return {
                    type: 'directory',
                    children: children
                };
            }
        } catch (error) {
            console.error('Erreur getPath:', error);
            return null;
        }
    }

    /**
     * Peuple le répertoire /bin avec les commandes disponibles
     */
    populateBinDirectory() {
        try {
            const binPath = '/bin';
            const binInode = this.inodeFS.getInodeByPath(binPath);
            
            if (!binInode) {
                console.warn('Dossier /bin non trouvé');
                return;
            }

            // Ajouter des fichiers factices pour les commandes
            const commands = Object.keys(this.app.commands || {});
            
            for (const cmd of commands) {
                try {
                    const cmdFileInode = this.inodeFS.createFile(`#!/bin/sh\n# Commande: ${cmd}\n# Description: ${this.app.COMMAND_METADATA?.[cmd]?.description || 'Commande système'}\necho "Exécution de ${cmd}"`);
                    this.inodeFS.addToDirectory(binPath, cmd, cmdFileInode.id);
                } catch (error) {
                    // Ignorer si la commande existe déjà
                }
            }

            console.log(`✅ ${commands.length} commandes ajoutées au répertoire /bin`);
        } catch (error) {
            console.error('Erreur peuplement /bin:', error);
        }
    }

    /**
     * Exporte le système I-Node
     */
    export() {
        return this.inodeFS.export();
    }

    /**
     * Importe un système I-Node
     */
    import(data) {
        this.inodeFS.import(data);
    }

    /**
     * Sauvegarde vers le format legacy pour compatibilité
     */
    saveToLegacyFormat() {
        try {
            const legacyFS = this.convertToLegacyFormat('/', {});
            return legacyFS;
        } catch (error) {
            console.error('Erreur conversion legacy:', error);
            return null;
        }
    }

    /**
     * Convertit récursivement vers le format legacy
     */
    convertToLegacyFormat(path, result) {
        const inode = this.inodeFS.getInodeByPath(path);
        if (!inode) return result;

        if (inode.type === 'directory') {
            const dirData = {
                type: 'directory',
                children: {}
            };

            const dirEntries = this.inodeFS.directories.get(inode.id);
            if (dirEntries) {
                for (const [name, childInodeId] of dirEntries.entries()) {
                    if (name !== '.' && name !== '..') {
                        const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
                        const childInode = this.inodeFS.inodes.get(childInodeId);
                        
                        if (childInode) {
                            if (childInode.type === 'file') {
                                dirData.children[name] = {
                                    type: 'file',
                                    content: childInode.data
                                };
                            } else {
                                dirData.children[name] = this.convertToLegacyFormat(childPath, {
                                    type: 'directory',
                                    children: {}
                                });
                            }
                        }
                    }
                }
            }

            result[path] = dirData;
            return dirData;
        }

        return result;
    }
}

// Export en tant que module ES6
export default INodeAdapter;
