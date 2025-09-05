/**
 * Nouvelles commandes pour exploiter les fonctionnalités des I-Nodes
 * À intégrer dans l'objet commands de l'application principale
 */

export const inodeCommands = {
    /**
     * Commande ln - Crée des liens durs
     */
    ln(args) {
        // Vérifier que l'adaptateur I-Node est disponible
        if (!this.inodeAdapter) {
            this.addOutput('Erreur: système I-Node non initialisé', 'error');
            return;
        }

        const options = this.parseOptions(args, {
            'help': 'help',
            'v': 'verbose'
        });

        if (options.help || args.includes('--help')) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-blue-600 rounded-lg p-4 my-2">
                    <div class="text-blue-400 font-bold text-lg mb-2">LN - Créer des liens</div>
                    <div class="text-gray-300 mb-2">Crée un lien dur vers un fichier existant.</div>
                    <div class="text-yellow-300 font-bold mb-1">SYNOPSIS:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">ln [OPTIONS] SOURCE LIEN</div>
                    <div class="text-yellow-300 font-bold mb-1">OPTIONS:</div>
                    <div class="ml-4 space-y-1">
                        <div class="text-gray-300">-v, --verbose    Mode verbeux</div>
                        <div class="text-gray-300">--help           Affiche cette aide</div>
                    </div>
                    <div class="text-yellow-300 font-bold mb-1">EXEMPLES:</div>
                    <div class="ml-4 space-y-1 font-mono text-green-400">
                        <div>ln file1.txt file2.txt</div>
                        <div>ln /home/user/important.txt /tmp/backup.txt</div>
                        <div>ln -v document.pdf /shared/document.pdf</div>
                    </div>
                    <div class="text-orange-300 text-sm mt-2">
                        Note: Les liens durs permettent à un même fichier d'apparaître dans plusieurs dossiers.
                    </div>
                </div>
            `, 'system');
            return;
        }

        if (options._.length < 2) {
            this.addOutput('ln: arguments manquants. Usage: ln SOURCE LIEN', 'error');
            return;
        }

        const sourcePath = this.resolvePath(options._[0]);
        const linkPath = this.resolvePath(options._[1]);
        
        // Extraire le dossier parent et le nom du lien
        const linkParts = linkPath.split('/').filter(p => p !== '');
        const linkName = linkParts.pop();
        const parentPath = linkParts.length > 0 ? '/' + linkParts.join('/') : '/';

        try {
            const success = this.inodeAdapter.createHardLink(sourcePath, parentPath, linkName);
            
            if (success) {
                if (options.verbose) {
                    const sourceStats = this.inodeAdapter.stat(sourcePath);
                    this.addOutput(`
                        <div class="border border-green-500 rounded-lg p-3 bg-green-900/20">
                            <div class="text-green-400 font-bold mb-2">✅ Lien dur créé avec succès</div>
                            <div class="space-y-1 text-sm">
                                <div>Source: <span class="text-blue-300">${sourcePath}</span></div>
                                <div>Lien: <span class="text-blue-300">${linkPath}</span></div>
                                <div>I-Node: <span class="text-yellow-300">#${sourceStats.inodeId}</span></div>
                                <div>Liens totaux: <span class="text-purple-300">${sourceStats.linkCount}</span></div>
                            </div>
                        </div>
                    `, 'system');
                } else {
                    this.addOutput(`Lien dur créé: ${sourcePath} → ${linkPath}`, 'system');
                }
            } else {
                this.addOutput(`ln: impossible de créer le lien '${linkPath}'`, 'error');
            }
        } catch (error) {
            this.addOutput(`ln: ${error.message}`, 'error');
        }
    },

    /**
     * Commande stat - Affiche les informations détaillées d'un fichier
     */
    stat(args) {
        if (!this.inodeAdapter) {
            this.addOutput('Erreur: système I-Node non initialisé', 'error');
            return;
        }

        if (args.includes('--help')) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-purple-600 rounded-lg p-4 my-2">
                    <div class="text-purple-400 font-bold text-lg mb-2">STAT - Informations fichier</div>
                    <div class="text-gray-300 mb-2">Affiche les informations détaillées d'un fichier ou dossier.</div>
                    <div class="text-yellow-300 font-bold mb-1">SYNOPSIS:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">stat [OPTIONS] FICHIER</div>
                    <div class="text-yellow-300 font-bold mb-1">EXEMPLES:</div>
                    <div class="ml-4 space-y-1 font-mono text-green-400">
                        <div>stat welcome.txt</div>
                        <div>stat /home/user</div>
                        <div>stat .</div>
                    </div>
                </div>
            `, 'system');
            return;
        }

        if (args.length === 0) {
            this.addOutput('stat: argument manquant. Usage: stat FICHIER', 'error');
            return;
        }

        const targetPath = this.resolvePath(args[0]);
        
        try {
            const stats = this.inodeAdapter.stat(targetPath);
            if (!stats) {
                this.addOutput(`stat: impossible d'obtenir les informations de '${args[0]}'`, 'error');
                return;
            }

            const typeIcon = stats.type === 'directory' ? '📁' : '📄';
            const sizeDisplay = stats.type === 'file' ? `${stats.size} octets` : 'N/A (dossier)';
            
            this.addOutput(`
                <div class="border border-purple-500 rounded-xl p-4 bg-purple-900/20">
                    <div class="flex items-center mb-4">
                        <span class="text-2xl mr-3">${typeIcon}</span>
                        <div>
                            <h3 class="text-white font-bold text-lg">${targetPath}</h3>
                            <span class="text-purple-300">Informations I-Node</span>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                <span class="text-purple-300 font-medium">Type:</span>
                                <span class="text-white font-mono">${stats.type}</span>
                            </div>
                            <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                <span class="text-blue-300 font-medium">I-Node:</span>
                                <span class="text-white font-mono">#${stats.inodeId}</span>
                            </div>
                            <div class="flex justify-between p-2 bg-green-900/30 rounded">
                                <span class="text-green-300 font-medium">Liens durs:</span>
                                <span class="text-white font-mono">${stats.linkCount}</span>
                            </div>
                            <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                <span class="text-yellow-300 font-medium">Taille:</span>
                                <span class="text-white font-mono">${sizeDisplay}</span>
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                <span class="text-red-300 font-medium">Créé:</span>
                                <span class="text-white font-mono text-xs">${stats.created.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                <span class="text-orange-300 font-medium">Modifié:</span>
                                <span class="text-white font-mono text-xs">${stats.modified.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between p-2 bg-cyan-900/30 rounded">
                                <span class="text-cyan-300 font-medium">Accédé:</span>
                                <span class="text-white font-mono text-xs">${stats.accessed.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${stats.linkCount > 1 ? `
                        <div class="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-500">
                            <div class="text-indigo-300 font-medium mb-2">🔗 Tous les liens vers ce fichier:</div>
                            <div class="space-y-1">
                                ${stats.allPaths.map(path => 
                                    `<div class="text-indigo-200 font-mono text-sm">→ ${path}</div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `, 'system');
            
        } catch (error) {
            this.addOutput(`stat: ${error.message}`, 'error');
        }
    },

    /**
     * Commande links - Trouve tous les liens vers un fichier
     */
    links(args) {
        if (!this.inodeAdapter) {
            this.addOutput('Erreur: système I-Node non initialisé', 'error');
            return;
        }

        if (args.includes('--help')) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-cyan-600 rounded-lg p-4 my-2">
                    <div class="text-cyan-400 font-bold text-lg mb-2">LINKS - Rechercher les liens</div>
                    <div class="text-gray-300 mb-2">Affiche tous les liens durs pointant vers un fichier.</div>
                    <div class="text-yellow-300 font-bold mb-1">SYNOPSIS:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">links FICHIER</div>
                    <div class="text-yellow-300 font-bold mb-1">EXEMPLES:</div>
                    <div class="ml-4 space-y-1 font-mono text-green-400">
                        <div>links important.txt</div>
                        <div>links /home/user/document.pdf</div>
                    </div>
                </div>
            `, 'system');
            return;
        }

        if (args.length === 0) {
            this.addOutput('links: argument manquant. Usage: links FICHIER', 'error');
            return;
        }

        const targetPath = this.resolvePath(args[0]);
        
        try {
            const allLinks = this.inodeAdapter.findLinks(targetPath);
            const stats = this.inodeAdapter.stat(targetPath);
            
            if (!stats) {
                this.addOutput(`links: '${args[0]}' n'existe pas`, 'error');
                return;
            }

            if (allLinks.length === 0) {
                this.addOutput(`Aucun lien trouvé pour '${targetPath}'`, 'system');
                return;
            }

            this.addOutput(`
                <div class="border border-cyan-500 rounded-lg p-4 bg-cyan-900/20">
                    <div class="flex items-center mb-3">
                        <span class="text-2xl mr-2">🔗</span>
                        <div>
                            <span class="font-bold text-cyan-400 text-lg">Liens vers ${targetPath}</span>
                            <div class="text-gray-300 text-sm">I-Node #${stats.inodeId} • ${allLinks.length} lien(s)</div>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        ${allLinks.map((linkPath, index) => `
                            <div class="flex items-center p-2 bg-cyan-900/30 rounded">
                                <span class="text-cyan-300 mr-2">${index + 1}.</span>
                                <span class="text-white font-mono">${linkPath}</span>
                                ${linkPath === targetPath ? '<span class="ml-2 text-yellow-400 text-xs">(original)</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mt-3 text-xs text-gray-400">
                        Tous ces chemins pointent vers le même fichier physique.
                    </div>
                </div>
            `, 'system');
            
        } catch (error) {
            this.addOutput(`links: ${error.message}`, 'error');
        }
    },

    /**
     * Commande du améliorée - Affiche l'utilisation disque avec informations I-Node
     */
    du(args) {
        if (!this.inodeAdapter) {
            this.addOutput('Erreur: système I-Node non initialisé', 'error');
            return;
        }

        const options = this.parseOptions(args, {
            'h': 'human-readable',
            's': 'summarize',
            'a': 'all',
            'i': 'inodes',
            'help': 'help'
        });

        if (options.help) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-orange-600 rounded-lg p-4 my-2">
                    <div class="text-orange-400 font-bold text-lg mb-2">DU - Utilisation disque</div>
                    <div class="text-gray-300 mb-2">Affiche l'utilisation de l'espace disque avec informations I-Node.</div>
                    <div class="text-yellow-300 font-bold mb-1">SYNOPSIS:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">du [OPTIONS] [REPERTOIRE]</div>
                    <div class="text-yellow-300 font-bold mb-1">OPTIONS:</div>
                    <div class="ml-4 space-y-1">
                        <div class="text-gray-300">-h    Format lisible par l'homme</div>
                        <div class="text-gray-300">-s    Résumé seulement</div>
                        <div class="text-gray-300">-a    Tous les fichiers</div>
                        <div class="text-gray-300">-i    Informations I-Nodes</div>
                    </div>
                </div>
            `, 'system');
            return;
        }

        const targetPath = options._.length > 0 ? this.resolvePath(options._[0]) : this.currentDir;
        
        try {
            const stats = this.inodeAdapter.stat(targetPath);
            if (!stats || stats.type !== 'directory') {
                this.addOutput(`du: '${targetPath}' n'est pas un dossier`, 'error');
                return;
            }

            this.addOutput(`
                <div class="border border-orange-500 rounded-lg p-4 bg-orange-900/20">
                    <div class="text-orange-400 font-bold text-lg mb-3">📊 Utilisation disque - ${targetPath}</div>
                    ${this.generateDiskUsageReport(targetPath, options)}
                </div>
            `, 'system');
            
        } catch (error) {
            this.addOutput(`du: ${error.message}`, 'error');
        }
    },

    /**
     * Commande fsck - Vérifie l'intégrité du système de fichiers I-Node
     */
    fsck(args) {
        if (!this.inodeAdapter) {
            this.addOutput('Erreur: système I-Node non initialisé', 'error');
            return;
        }

        if (args.includes('--help')) {
            this.addOutput(`
                <div class="bg-gray-800/50 border border-red-600 rounded-lg p-4 my-2">
                    <div class="text-red-400 font-bold text-lg mb-2">FSCK - Vérification système fichiers</div>
                    <div class="text-gray-300 mb-2">Vérifie l'intégrité du système de fichiers I-Node.</div>
                    <div class="text-yellow-300 font-bold mb-1">SYNOPSIS:</div>
                    <div class="ml-4 text-green-400 font-mono mb-2">fsck [OPTIONS]</div>
                    <div class="text-yellow-300 font-bold mb-1">OPTIONS:</div>
                    <div class="ml-4 space-y-1">
                        <div class="text-gray-300">-v    Mode verbeux</div>
                        <div class="text-gray-300">-f    Force la vérification</div>
                    </div>
                </div>
            `, 'system');
            return;
        }

        const options = this.parseOptions(args, {
            'v': 'verbose',
            'f': 'force'
        });

        this.addOutput(`
            <div class="border border-red-500 rounded-lg p-4 bg-red-900/20">
                <div class="text-red-400 font-bold text-lg mb-3">🔍 Vérification du système de fichiers</div>
                ${this.performFileSystemCheck(options)}
            </div>
        `, 'system');
    }
};

// Méthodes utilitaires pour les nouvelles commandes
export const inodeUtilities = {
    /**
     * Génère un rapport d'utilisation disque
     */
    generateDiskUsageReport(path, options) {
        const dirList = this.inodeAdapter.inodeFS.listDirectory(path);
        let totalSize = 0;
        let totalInodes = 0;
        let report = '';

        const processedInodes = new Set(); // Pour éviter de compter les liens durs multiples fois

        for (const item of dirList) {
            if (item.name === '.' || item.name === '..') continue;
            
            const itemStats = this.inodeAdapter.stat(`${path}/${item.name}`);
            if (itemStats && !processedInodes.has(itemStats.inodeId)) {
                processedInodes.add(itemStats.inodeId);
                totalSize += itemStats.size;
                totalInodes++;
                
                const sizeDisplay = options['human-readable'] ? this.formatBytes(itemStats.size) : `${itemStats.size}B`;
                const icon = item.type === 'directory' ? '📁' : '📄';
                
                if (options.all || item.type === 'directory') {
                    report += `
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-300">${icon} ${item.name}</span>
                            <span class="text-orange-400">${sizeDisplay}</span>
                        </div>
                    `;
                }
                
                if (options.inodes) {
                    report += `
                        <div class="ml-6 text-xs text-gray-400">
                            I-Node: ${itemStats.inodeId} | Liens: ${itemStats.linkCount}
                        </div>
                    `;
                }
            }
        }

        const totalSizeDisplay = options['human-readable'] ? this.formatBytes(totalSize) : `${totalSize}B`;

        report += `
            <div class="mt-3 pt-3 border-t border-orange-500/50">
                <div class="flex justify-between text-orange-300 font-bold">
                    <span>Total:</span>
                    <span>${totalSizeDisplay} • ${totalInodes} I-Nodes uniques</span>
                </div>
            </div>
        `;

        return report;
    },

    /**
     * Effectue une vérification du système de fichiers
     */
    performFileSystemCheck(options) {
        const issues = [];
        const warnings = [];
        let checked = 0;

        try {
            const checkResult = this.inodeAdapter.checkFileSystemIntegrity();
            issues.push(...checkResult.issues);
            warnings.push(...checkResult.warnings);
            checked = checkResult.checked;
        } catch (error) {
            issues.push(`Erreur lors de la vérification: ${error.message}`);
        }

        let report = `
            <div class="mb-3">
                <div class="text-green-400">✅ ${checked} I-Nodes vérifiés</div>
            </div>
        `;

        if (issues.length > 0) {
            report += `
                <div class="mb-3">
                    <div class="text-red-400 font-bold mb-2">❌ Problèmes détectés (${issues.length}):</div>
                    ${issues.map(issue => `<div class="text-red-300 text-sm ml-4">• ${issue}</div>`).join('')}
                </div>
            `;
        }

        if (warnings.length > 0) {
            report += `
                <div class="mb-3">
                    <div class="text-yellow-400 font-bold mb-2">⚠️ Avertissements (${warnings.length}):</div>
                    ${warnings.map(warning => `<div class="text-yellow-300 text-sm ml-4">• ${warning}</div>`).join('')}
                </div>
            `;
        }

        if (issues.length === 0 && warnings.length === 0) {
            report += `
                <div class="text-green-400 font-bold">✅ Système de fichiers sain</div>
                <div class="text-gray-300 text-sm">Aucun problème détecté.</div>
            `;
        }

        return report;
    }
};