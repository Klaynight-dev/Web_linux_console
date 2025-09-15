import TabManager from './tabs.js';
import { COMMAND_METADATA, commandHelpers } from './cmdList.js';

export const commands = {
        // Commandes pour la gestion des onglets
        ...TabManager.createTabCommands(),

        echo(args) {
            // Parse options
            const options = this.parseOptions(args, {
            'o': 'old',
            'old': 'old'
            });

            // Help option
            if (args.includes('--help')) {
                this.commands.man.call(this, ['echo']);
                return;
            }

            // Get text from remaining args
            const text = options._.join(' ').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            // Use old style if --old or -o option is provided
            if (options.old) {
            this.addOutput(text);
            return;
            }
            
            // Créer une interface plus moderne pour echo avec améliorations visuelles
            const echoHTML = `
            <div class="border border-blue-500/50 rounded-xl p-4 bg-gradient-to-br from-blue-900/20 to-gray-900/30 backdrop-blur-sm mt-2 shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <span class="text-white text-sm">📢</span>
                </div>
                <span class="font-bold text-blue-300 text-lg">Echo Output</span>
                </div>
                <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-xs text-gray-400 font-medium">Active</span>
                </div>
            </div>
            <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg"></div>
                <div class="relative bg-gray-800/60 rounded-lg p-4 border border-gray-600/50 shadow-inner">
                <div class="flex items-start space-x-3">
                    <div class="w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    <div class="flex-1 min-w-0">
                    <span class="text-white font-mono text-lg leading-relaxed break-words">${text}</span>
                    </div>
                </div>
                </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
                <div class="flex items-center space-x-2 text-xs text-gray-400">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="flex items-center space-x-1 text-xs text-gray-500">
                <span>Length: ${text.length}</span>
                <span>•</span>
                <span>Type: String</span>
                </div>
            </div>
            </div>
            `;

            this.addOutput(echoHTML, 'system');
        },
        say (args) {
            this.commands.echo.call(this, args);
        },
        ls(args) {
            // Parser les options avec support de toutes les options standard de ls
            const options = this.parseOptions(args, {
                'l': 'long',
                'a': 'all',
                'A': 'almost-all',
                'h': 'human-readable',
                'r': 'reverse',
                't': 'time',
                'S': 'size',
                '1': 'one',
                'd': 'directory',
                'R': 'recursive',
                'F': 'classify',
                'G': 'no-group',
                'help': 'help'
            });

            // Afficher l'aide si demandée
            if (options.help) {
                this.commands.man.call(this, ['ls']);
                return;
            }

            // Déterminer le chemin cible
            const targetPathArg = options._[0] || '.';
            const targetPath = this.resolvePath(targetPathArg);
            
            // Vérifier si le système I-Node est disponible
            const useInodeSystem = this.inodeAdapter && this.inodeAdapter.inodeFS;
            let targetNode = null;
            
            if (useInodeSystem) {
                const nodeInfo = this.inodeAdapter.getNodeInfo(targetPath);
                if (nodeInfo) {
                    // Adapter les informations du système I-Node au format attendu
                    if (nodeInfo.type === 'directory') {
                        const children = {};
                        const dirContents = this.inodeAdapter.listDirectory(targetPath);
                        
                        for (const item of dirContents) {
                            if (item.name !== '.' && item.name !== '..') {
                                if (item.type === 'file') {
                                    children[item.name] = {
                                        type: 'file',
                                        content: this.inodeAdapter.readFile(targetPath === '/' ? `/${item.name}` : `${targetPath}/${item.name}`) || ''
                                    };
                                } else {
                                    children[item.name] = {
                                        type: 'directory',
                                        children: {}
                                    };
                                }
                            }
                        }
                        
                        targetNode = {
                            type: 'directory',
                            children: children
                        };
                    } else {
                        targetNode = {
                            type: 'file',
                            content: this.inodeAdapter.readFile(targetPath) || ''
                        };
                    }
                }
            } else {
                targetNode = this.getPath(targetPath);
            }

            if (!targetNode) {
                this.addOutput(`ls: impossible d'accéder à '${targetPathArg}': Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            // Si c'est un fichier et pas l'option -d, afficher juste le nom
            if (targetNode.type !== 'directory' && !options.directory) {
                if (options.long) {
                    const stats = this.getFileStats(targetNode, targetPath.split('/').pop());
                    const longOutput = this.formatLongListing([stats], options);
                    if (longOutput) {
                        longOutput.split('\n').forEach(line => {
                            if (line.trim()) {
                                this.addOutput(line);
                            }
                        });
                    }
                } else {
                    this.addOutput(targetPath.split('/').pop() || targetPathArg);
                }
                return;
            }

            // Si option -d, afficher juste le répertoire lui-même
            if (options.directory && targetNode.type === 'directory') {
                if (options.long) {
                    const stats = this.getFileStats(targetNode, targetPath.split('/').pop() || '.');
                    const longOutput = this.formatLongListing([stats], options);
                    if (longOutput) {
                        longOutput.split('\n').forEach(line => {
                            if (line.trim()) {
                                this.addOutput(line);
                            }
                        });
                    }
                } else {
                    this.addOutput(targetPath.split('/').pop() || '.');
                }
                return;
            }

            // Obtenir la liste des fichiers
            let files = this.getFileList(targetNode, options);

            // Trier selon les options
            files = this.sortFileList(files, options);

            // Afficher selon le format demandé
            if (options.long) {
                const longOutput = this.formatLongListing(files, options);
                if (longOutput) {
                    // Diviser en lignes et ajouter chaque ligne séparément
                    longOutput.split('\n').forEach(line => {
                        if (line.trim()) {
                            this.addOutput(line);
                        }
                    });
                }
            } else if (options.one) {
                this.addOutput(files.map(file => this.formatFileName(file, options)).join('\n'));
            } else {
                if (files.length === 0) {
                    return; // Répertoire vide
                }
                // Affichage en colonnes avec couleurs
                this.addOutput(files.map(file => this.formatFileName(file, options)).join('<span class="mx-1"></span>'));
            }

            // Affichage récursif si demandé
            if (options.recursive) {
                this.displayRecursive(targetNode, targetPath, options, 1);
            }
        },
        cd(args) {
            if (args.length === 0) {
                this.currentDir = this.resolvePath('/home/user');
                this.updatePrompt();
                return;
            }
            const newPath = this.resolvePath(args[0]);
            const targetNode = this.getPath(newPath);

            if (!targetNode) {
                this.addOutput(`cd: ${args[0]}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            if (targetNode.type !== 'directory') {
                this.addOutput(`cd: ${args[0]}: Pas un dossier`, 'error');
                return;
            }
            this.currentDir = newPath;
            this.updatePrompt();
        },
        pwd() {
            this.addOutput(this.currentDir);
        },
        clear() {
            this.clearConsole();
        },
        cat(args) {
            if (args.length === 0) {
                this.addOutput('cat: manque un opérande', 'error');
                this.addOutput('Utilisez "cat --help" pour plus d\'informations.');
                return;
            }

            // Handle --help option
            if (args[0] === '--help') {
                this.commands.man.call(this, ['cat']);
                return;
            }

            const targetPath = this.resolvePath(args[0]);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
                this.addOutput(`cat: ${args[0]}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            if (targetNode.type === 'directory') {
                this.addOutput(`cat: ${args[0]}: Est un dossier`, 'error');
                return;
            }
            // Display content as HTML (allows formatting from rich text editor)
            this.addOutput(targetNode.content);
        },
        help(args) {
            if (args.length > 0) {
            const helpOption = args[0];
            if (helpOption === '--help') {
                this.commands.man.call(this, ['help']);
                return;
            }
            }

            this.addOutput('<span class="font-bold text-purple-300 text-lg">Commandes disponibles :</span>');

            const grouped = commandHelpers.groupCommandsByCategory();
            const categoryOrder = commandHelpers.getCategoryOrder();

            categoryOrder.forEach((category, index) => {
            if (grouped[category]) {
                // Filtrer les commandes désactivées
                const enabledCommands = grouped[category].filter(cmdName => this.isCommandEnabled(cmdName));
                
                if (enabledCommands.length > 0) {
                    const icon = commandHelpers.getCategoryIcon(category);
                    
                    this.addOutput(`<span class="underline text-blue-300 font-semibold mt-2">${icon} ${category}</span>`);
                    
                    enabledCommands.forEach(cmdName => {
                    const metadata = COMMAND_METADATA[cmdName];
                    if (metadata) {
                        let commandLine = `<span class="ml-4"><span class="text-green-400 cursor-pointer clickable-command" data-command="${cmdName}">${cmdName}</span>`;
                        
                        // Ajouter helpOption avec style si présent ET différent de "None"
                        if (metadata.helpOption && metadata.helpOption !== "None" && metadata.helpOption.trim() !== "") {
                        // Échapper les caractères < et > pour l'affichage HTML
                        const escapedHelpOption = metadata.helpOption.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        commandLine += ` <span class="bg-gray-700 text-gray-200 px-1 rounded">${escapedHelpOption}</span>`;
                        }
                        
                        commandLine += ` <span class="text-gray-400">- ${metadata.description}</span></span>`;
                        this.addOutput(commandLine);
                    }
                    });
                    
                    // Ajouter séparateur sauf pour la dernière catégorie avec des commandes
                    const remainingCategories = categoryOrder.slice(index + 1);
                    const hasMoreEnabledCategories = remainingCategories.some(cat => 
                        grouped[cat] && grouped[cat].some(cmd => this.isCommandEnabled(cmd))
                    );
                    if (hasMoreEnabledCategories) {
                        this.addOutput('<hr class="my-2 border-gray-700">');
                    }
                }
            }
            });

            // Ajouter les commandes des plugins (filtrées)
            if (this.pluginManager) {
                const pluginCommands = this.pluginManager.getAllCommands().filter(cmd => this.isCommandEnabled(cmd.name));
                if (pluginCommands.length > 0) {
                    this.addOutput('<hr class="my-2 border-gray-700">');
                    this.addOutput(`<span class="underline text-purple-300 font-semibold mt-2">🔌 Plugins</span>`);
                    
                    pluginCommands.forEach(cmd => {
                        this.addOutput(`<span class="ml-4"><span class="text-purple-400 cursor-pointer clickable-command" data-command="${cmd.name}">${cmd.name}</span> <span class="text-gray-400">- ${cmd.description}</span></span>`);
                    });
                }
            }

            this.addOutput('<hr class="my-2 border-gray-700">');
            this.addOutput('<div class="text-sm text-gray-400 mt-3">💡 <strong>Nouveauté:</strong> Utilisez <span class="text-purple-400 clickable-command cursor-pointer" data-command="plugins manager">plugins manager</span> pour gérer vos extensions personnalisées!</div>');
            this.addOutput('<div class="text-sm text-gray-400 mt-2">⚙️ <strong>Gestion:</strong> Utilisez le menu <span class="text-blue-400 cursor-pointer" onclick="app.showCommandManagerModal()">Aide → Commandes</span> pour gérer la visibilité des commandes.</div>');
            
            // Configurer les commandes cliquables après avoir ajouté tout l'output
            setTimeout(() => this.setupClickableCommands(), 0);
        },
        mkdir(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('mkdir: manque un nom de dossier', 'error');
                return;
            }
            const dirName = args[0].trim();
            if (dirName.includes('/')) {
                this.addOutput('mkdir: le nom du dossier ne doit pas contenir de "/"', 'error');
                return;
            }

            // Utiliser le système I-Node si disponible
            if (this.inodeAdapter) {
                const success = this.inodeAdapter.createDirectory(this.currentDir, dirName);
                if (success) {
                    this.addOutput(`Dossier '${dirName}' créé.`);
                    this.addToHistory(`mkdir ${dirName}`, `Dossier '${dirName}' créé.`, 'system');
                    
                    // Sauvegarder le système I-Node optimisé
                    this.saveInodeSystemOptimized();
                } else {
                    this.addOutput(`mkdir: impossible de créer le dossier '${dirName}'`, 'error');
                }
                return;
            }

            // Fallback vers l'ancien système
            const currentNode = this.getPath(this.currentDir);
            if (!currentNode || currentNode.type !== 'directory') {
                this.addOutput('mkdir: dossier courant invalide', 'error');
                return;
            }
            if (currentNode.children[dirName]) {
                this.addOutput(`mkdir: impossible de créer le dossier '${dirName}': Le fichier existe`, 'error');
                return;
            }
            currentNode.children[dirName] = {
                type: 'directory',
                children: {}
            };
            
            // Sauvegarder optimisé pour éviter les gros cookies
            this.saveFileSystemOptimized();
            
            this.addOutput(`Dossier '${dirName}' créé.`);
            this.addToHistory(`mkdir ${dirName}`, `Dossier '${dirName}' créé.`, 'system');
        },
        rm(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('rm: manque un nom de fichier ou dossier', 'error');
                return;
            }
            // Retire le slash final éventuel
            let targetName = args[0].trim();
            if (targetName.endsWith('/')) {
                targetName = targetName.slice(0, -1);
            }
            if (targetName === '.' || targetName === '..') {
                this.addOutput(`rm: suppression de '${targetName}' non autorisée`, 'error');
                return;
            }

            // Utiliser le système I-Node si disponible
            if (this.inodeAdapter) {
                const success = this.inodeAdapter.remove(this.currentDir, targetName);
                if (success) {
                    this.addOutput(`'${targetName}' supprimé.`);
                    
                    // Sauvegarder optimisé
                    this.saveInodeSystemOptimized();
                } else {
                    this.addOutput(`rm: impossible de supprimer '${targetName}'`, 'error');
                }
                return;
            }

            // Fallback vers l'ancien système
            const currentNode = this.getPath(this.currentDir);
            if (!currentNode || currentNode.type !== 'directory') {
                this.addOutput('rm: dossier courant invalide', 'error');
                return;
            }
            if (!currentNode.children[targetName]) {
                this.addOutput(`rm: impossible de supprimer '${targetName}': Aucun fichier ou dossier de ce type`, 'error');
                return;
            }
            // For directories, only allow if empty
            if (currentNode.children[targetName].type === 'directory' &&
                Object.keys(currentNode.children[targetName].children).length > 0) {
                this.addOutput(`rm: impossible de supprimer '${targetName}': Le dossier n'est pas vide`, 'error');
                return;
            }
            delete currentNode.children[targetName];
            
            // Sauvegarder optimisé
            this.saveFileSystemOptimized();
            this.addOutput(`'${targetName}' supprimé.`);
        },
        touch(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('touch: manque un nom de fichier', 'error');
                return;
            }
            const fileName = args[0].trim();
            if (fileName.includes('/')) {
                this.addOutput('touch: le nom du fichier ne doit pas contenir de "/"', 'error');
                return;
            }

            // Utiliser le système I-Node si disponible
            if (this.inodeAdapter) {
                const currentNode = this.getPath(this.currentDir);
                if (currentNode && currentNode.children && currentNode.children[fileName]) {
                    this.addOutput(`Fichier '${fileName}' déjà existant.`);
                    return;
                }

                const success = this.inodeAdapter.createFile(this.currentDir, fileName, '');
                if (success) {
                    this.addOutput(`Fichier '${fileName}' créé.`);
                    
                    // Sauvegarder optimisé
                    this.saveInodeSystemOptimized();
                } else {
                    this.addOutput(`touch: impossible de créer '${fileName}'`, 'error');
                }
                return;
            }

            // Fallback vers l'ancien système
            const currentNode = this.getPath(this.currentDir);
            if (!currentNode || currentNode.type !== 'directory') {
                this.addOutput('touch: dossier courant invalide', 'error');
                return;
            }
            if (currentNode.children[fileName]) {
                // Si le fichier existe déjà, ne rien faire (comportement touch standard)
                this.addOutput(`Fichier '${fileName}' déjà existant.`);
                return;
            }
            currentNode.children[fileName] = {
                type: 'file',
                content: ''
            };
            
            // Sauvegarder optimisé
            this.saveFileSystemOptimized();
            this.addOutput(`Fichier '${fileName}' créé.`);
        },
        about() {
            this.openAboutModal();
        },
        version: async function() {
            const loadingAnimation = this.createLoadingAnimation({
                title: 'Récupération des informations de version...',
                progressBarColors: 'from-purple-500 to-blue-500',
                steps: [
                    { text: 'Lecture du fichier version.json...', color: 'text-purple-400', delay: 0 },
                    { text: 'Validation des données...', color: 'text-blue-400', delay: 200 },
                    { text: 'Génération de l\'affichage...', color: 'text-green-400', delay: 400 }
                ]
            });

            try {
                const response = await fetch('/version.json');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const versionData = await response.json();

                // Terminer l'animation
                loadingAnimation.complete();

                const versionHTML = `
                <div class="border border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/20 backdrop-blur-sm mt-3">
                    <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-purple-400">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        </div>
                        <div>
                        <h2 class="text-2xl font-bold text-white">CLK Console</h2>
                        <p class="text-purple-300 text-sm">Console Linux Web Interactive</p>
                        </div>
                    </div>
                    <div class="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-lg font-bold border border-purple-500/30">
                        v${versionData.version || 'N/A'}
                    </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-blue-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Informations Version
                        </h3>
                        <div class="space-y-2 text-sm">
                        <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                            <span class="text-purple-300 font-medium">Version:</span>
                            <span class="text-white font-mono">${versionData.version || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                            <span class="text-blue-300 font-medium">Date:</span>
                            <span class="text-white font-mono">${versionData.date || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-green-900/30 rounded">
                            <span class="text-green-300 font-medium">Auteur:</span>
                            <span class="text-white font-mono">${versionData.author || 'Klaynight'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                            <span class="text-yellow-300 font-medium">Environnement:</span>
                            <span class="text-white font-mono">${versionData.environment || 'Production'}</span>
                        </div>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-purple-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Statistiques Système
                        </h3>
                        <div class="space-y-2 text-sm">
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Commandes:</span>
                            <span class="text-white font-mono">${Object.keys(COMMAND_METADATA).length}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Runtime:</span>
                            <span class="text-white font-mono">JavaScript</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Plateforme:</span>
                            <span class="text-white font-mono">${navigator.userAgentData?.platform || navigator.userAgent.match(/\(([^)]+)\)/)?.[1]?.split(';')[0]?.trim() || 'Inconnu'}</span>
                        </div>
                        <div class="flex justify-between p-2 bg-gray-700/30 rounded">
                            <span class="text-gray-300 font-medium">Navigateur:</span>
                            <span class="text-white font-mono">${navigator.userAgent.split(' ')[0]}</span>
                        </div>
                        </div>
                    </div>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-gray-600">
                    <div class="flex items-center justify-end text-sm text-gray-400">
                        <div class="text-xs">
                        Made with ❤️ by <span class="text-purple-400">${versionData.author || versionData.owner?.login || 'Klaynight'}</span>
                        </div>
                    </div>
                    </div>
                </div>
                `;
                
                this.addOutput(versionHTML, 'system');

            } catch (error) {
                loadingAnimation.complete();

                // Affichage d'erreur avec fallback
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                    <div class="flex items-center mb-2">
                        <span class="text-red-400 mr-2">❌</span>
                        <span class="text-red-300 font-medium">Erreur lors de la récupération de la version</span>
                    </div>
                    <div class="text-red-400 text-sm">${error.message}</div>
                    <div class="text-gray-400 text-xs mt-2">
                        Affichage des informations de base disponibles...
                    </div>
                    </div>
                `, 'error');

                // Fallback vers l'affichage basique
                setTimeout(() => {
                    const fallbackHTML = `
                    <div class="border border-gray-500 rounded-xl p-6 bg-gray-800/50 mt-3">
                        <div class="text-center">
                        <div class="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-500 mx-auto mb-4">
                            <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">CLK Console</h2>
                        <p class="text-gray-300 mb-4">Console Linux Web Interactive (Mode hors ligne)</p>
                        <div class="text-sm text-gray-400">
                            <div>Version: Information indisponible</div>
                            <div>Date: ${new Date().toLocaleDateString()}</div>
                            <div>Commandes disponibles: ${Object.keys(COMMAND_METADATA).length}</div>
                        </div>
                        </div>
                    </div>
                    `;
                    this.addOutput(fallbackHTML, 'system');
                }, 1000);
            }
        },

        // Nouvelles commandes de versioning
        versionbump: async function(args) {
            if (!args || args.length === 0) {
                this.addOutput('Erreur: Un changelog est requis. Usage: versionbump [type] "changelog"', 'error');
                return;
            }

            let type = 'patch';
            let changelog = '';

            // Détecter si le premier argument est un type de version
            if (args[0] && ['major', 'minor', 'patch'].includes(args[0].toLowerCase())) {
                type = args[0].toLowerCase();
                changelog = args.slice(1).join(' ');
            } else {
                changelog = args.join(' ');
            }

            if (!changelog.trim()) {
                this.addOutput('Erreur: Un changelog est requis.', 'error');
                return;
            }

            const loadingAnimation = this.createLoadingAnimation({
                title: `Simulation mise à jour de version (${type})...`,
                progressBarColors: 'from-green-500 to-blue-500',
                steps: [
                    { text: 'Lecture de la version actuelle...', color: 'text-green-400', delay: 0 },
                    { text: 'Calcul de la nouvelle version...', color: 'text-blue-400', delay: 200 },
                    { text: 'Génération de la commande Node.js...', color: 'text-purple-400', delay: 400 }
                ]
            });

            try {
                const response = await fetch('/version.json');
                if (!response.ok) {
                    throw new Error(`Impossible de lire version.json: ${response.status}`);
                }
                
                const versionData = await response.json();
                const [major, minor, patch] = versionData.version.split('.').map(Number);
                
                let newVersion;
                switch(type) {
                    case 'major':
                        newVersion = `${major + 1}.0.0`;
                        break;
                    case 'minor':
                        newVersion = `${major}.${minor + 1}.0`;
                        break;
                    case 'patch':
                    default:
                        newVersion = `${major}.${minor}.${patch + 1}`;
                        break;
                }

                loadingAnimation.complete();

                const nodeCommand = `node version.js ${type} add "${changelog}"`;

                const updateHTML = `
                    <div class="border border-green-500 rounded-xl p-6 bg-gradient-to-br from-green-900/30 to-blue-900/20 backdrop-blur-sm mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-green-400">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">Commande Version générée</h2>
                                    <p class="text-green-300 text-sm">Mise à jour ${type} : ${versionData.version} → ${newVersion}</p>
                                </div>
                            </div>
                            <div class="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-lg font-bold border border-green-500/30">
                                v${newVersion}
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-blue-300 font-medium text-sm">Commande Node.js à exécuter :</span>
                                    <button onclick="navigator.clipboard.writeText('${nodeCommand}').then(() => app.addOutput('Commande copiée!', 'system'))" 
                                        class="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-600/30 transition-colors">
                                        Copier
                                    </button>
                                </div>
                                <code class="text-white font-mono text-sm bg-gray-800/80 block p-3 rounded border-l-4 border-green-500 break-all">${nodeCommand}</code>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                        <span class="text-red-300 font-medium">Version actuelle:</span>
                                        <span class="text-white font-mono">${versionData.version}</span>
                                    </div>
                                    <div class="flex justify-between p-2 bg-green-900/30 rounded">
                                        <span class="text-green-300 font-medium">Nouvelle version:</span>
                                        <span class="text-white font-mono font-bold">${newVersion}</span>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                        <span class="text-purple-300 font-medium">Type:</span>
                                        <span class="text-white font-mono">${type.toUpperCase()}</span>
                                    </div>
                                    <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                        <span class="text-blue-300 font-medium">Date:</span>
                                        <span class="text-white font-mono">${new Date().toISOString().split('T')[0]}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-3 bg-gray-900/30 rounded border-l-4 border-yellow-500">
                                <span class="text-yellow-300 font-medium text-sm">Changelog:</span>
                                <div class="text-white font-mono text-sm mt-1">${changelog}</div>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                            <div class="text-blue-400 text-sm">
                                💡 <strong>Instructions:</strong> Copiez la commande ci-dessus et exécutez-la dans votre terminal Node.js dans le répertoire racine du projet.
                            </div>
                        </div>
                    </div>
                `;
                
                this.addOutput(updateHTML, 'system');

            } catch (error) {
                loadingAnimation.complete();
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-red-400 mr-2">❌</span>
                            <span class="text-red-300 font-medium">Erreur lors de la génération de la commande</span>
                        </div>
                        <div class="text-red-400 text-sm">${error.message}</div>
                    </div>
                `, 'error');
            }
        },

        changelog: async function(args) {
            try {
                const response = await fetch('/version.json');
                if (!response.ok) {
                    throw new Error(`Impossible de lire version.json: ${response.status}`);
                }
                
                const versionData = await response.json();

                if (args && args.length > 0) {
                    // Générer commande pour modifier le changelog
                    const newChangelog = args.join(' ');
                    const nodeCommand = `node version.js patch add "${newChangelog}"`;
                    
                    const updateHTML = `
                        <div class="border border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/20 backdrop-blur-sm mt-3">
                            <div class="flex items-center space-x-3 mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-blue-400">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">Commande Changelog générée</h2>
                                    <p class="text-blue-300 text-sm">Nouvelle version patch avec changelog</p>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-blue-300 font-medium text-sm">Commande Node.js à exécuter :</span>
                                        <button onclick="navigator.clipboard.writeText('${nodeCommand}').then(() => app.addOutput('Commande copiée!', 'system'))" 
                                            class="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-600/30 transition-colors">
                                            Copier
                                        </button>
                                    </div>
                                    <code class="text-white font-mono text-sm bg-gray-800/80 block p-3 rounded border-l-4 border-blue-500 break-all">${nodeCommand}</code>
                                </div>
                                
                                <div class="grid gap-3">
                                    <div class="p-3 bg-red-900/30 rounded border-l-4 border-red-500">
                                        <span class="text-red-300 font-medium text-sm">Changelog actuel:</span>
                                        <div class="text-gray-300 font-mono text-sm mt-1">${versionData.changelog || 'Aucun'}</div>
                                    </div>
                                    <div class="p-3 bg-green-900/30 rounded border-l-4 border-green-500">
                                        <span class="text-green-300 font-medium text-sm">Nouveau changelog:</span>
                                        <div class="text-white font-mono text-sm mt-1 font-bold">${newChangelog}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    this.addOutput(updateHTML, 'system');
                } else {
                    // Afficher le changelog actuel
                    const changelogHTML = `
                        <div class="border border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/20 backdrop-blur-sm mt-3">
                            <div class="flex items-center space-x-3 mb-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-purple-400">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">Changelog Actuel</h2>
                                    <p class="text-purple-300 text-sm">Version ${versionData.version}</p>
                                </div>
                            </div>
                            
                            <div class="space-y-3">
                                <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                    <span class="text-purple-300 font-medium">Version:</span>
                                    <span class="text-white font-mono">${versionData.version}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                    <span class="text-blue-300 font-medium">Date:</span>
                                    <span class="text-white font-mono">${versionData.date}</span>
                                </div>
                                <div class="p-3 bg-gray-900/30 rounded">
                                    <span class="text-gray-300 font-medium">Changelog:</span>
                                    <div class="text-white font-mono text-sm mt-2 p-2 bg-gray-800/50 rounded border-l-4 border-blue-500">
                                        ${versionData.changelog || 'Aucun changelog disponible'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    this.addOutput(changelogHTML, 'system');
                }

            } catch (error) {
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-red-400 mr-2">❌</span>
                            <span class="text-red-300 font-medium">Erreur lors de l'accès au changelog</span>
                        </div>
                        <div class="text-red-400 text-sm">${error.message}</div>
                    </div>
                `, 'error');
            }
        },

        versionhistory: async function(args) {
            const loadingAnimation = this.createLoadingAnimation({
                title: 'Génération des commandes Node.js...',
                progressBarColors: 'from-indigo-500 to-purple-500',
                steps: [
                    { text: 'Récupération de l\'historique...', color: 'text-indigo-400', delay: 0 },
                    { text: 'Analyse des données...', color: 'text-purple-400', delay: 200 },
                    { text: 'Génération des commandes...', color: 'text-pink-400', delay: 400 }
                ]
            });

            try {
                const response = await fetch('/version.json');
                if (!response.ok) {
                    throw new Error(`Impossible de lire version.json: ${response.status}`);
                }
                
                const versionData = await response.json();
                const history = versionData.history || [];
                
                loadingAnimation.complete();

                const commandsHTML = `
                    <div class="border border-indigo-500 rounded-xl p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/20 backdrop-blur-sm mt-3">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-indigo-400">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">Commandes Node.js pour toutes les versions</h2>
                                    <p class="text-indigo-300 text-sm">Historique complet avec commandes de versioning</p>
                                </div>
                            </div>
                            <div class="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm font-bold border border-indigo-500/30">
                                ${history.length} versions
                            </div>
                        </div>
                        
                        <div class="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <div class="text-blue-400 text-sm mb-2">
                                💡 <strong>Instructions:</strong> Voici toutes les commandes Node.js pour reproduire l'historique des versions
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="
                                    const commands = Array.from(document.querySelectorAll('[data-node-command]')).map(el => el.dataset.nodeCommand).join('\\n');
                                    navigator.clipboard.writeText(commands).then(() => app.addOutput('Toutes les commandes copiées!', 'system'));
                                " class="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded border border-blue-500/30 hover:bg-blue-600/30 transition-colors">
                                    Copier toutes les commandes
                                </button>
                            </div>
                        </div>
                        
                        <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                            ${history.map((version, index) => {
                                const typeColors = {
                                    'major': 'text-red-400 bg-red-900/30 border-red-500',
                                    'minor': 'text-yellow-400 bg-yellow-900/30 border-yellow-500', 
                                    'patch': 'text-green-400 bg-green-900/30 border-green-500',
                                    'initial': 'text-blue-400 bg-blue-900/30 border-blue-500'
                                };
                                const colorClass = typeColors[version.type] || typeColors['patch'];
                                const nodeCommand = `node version.js ${version.type || 'patch'} add "${version.changelog}"`;
                                
                                return `
                                    <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/30 hover:bg-gray-700/30 transition-colors">
                                        <div class="flex items-center justify-between mb-3">
                                            <div class="flex items-center space-x-3">
                                                <span class="text-white font-bold text-lg font-mono">v${version.version}</span>
                                                <span class="px-2 py-1 rounded text-xs font-medium border ${colorClass}">
                                                    ${version.type?.toUpperCase() || 'PATCH'}
                                                </span>
                                                ${index === 0 ? '<span class="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500">ACTUELLE</span>' : ''}
                                            </div>
                                            <span class="text-gray-400 text-sm font-mono">${version.date}</span>
                                        </div>
                                        
                                        <div class="mb-3 p-3 bg-gray-900/50 rounded border border-gray-600">
                                            <div class="flex items-center justify-between mb-1">
                                                <span class="text-gray-300 text-xs font-medium">Commande Node.js:</span>
                                                <button onclick="navigator.clipboard.writeText('${nodeCommand}').then(() => app.addOutput('Commande copiée!', 'system'))" 
                                                    class="text-xs bg-gray-600/20 text-gray-300 px-2 py-1 rounded border border-gray-500/30 hover:bg-gray-600/40 transition-colors">
                                                    Copier
                                                </button>
                                            </div>
                                            <code data-node-command="${nodeCommand}" class="text-green-300 font-mono text-xs bg-gray-800/80 block p-2 rounded border-l-2 border-green-500 break-all">
                                                ${nodeCommand}
                                            </code>
                                        </div>
                                        
                                        <div class="text-gray-300 text-sm bg-gray-900/50 p-3 rounded border-l-4 border-indigo-500">
                                            <strong>Changelog:</strong> ${version.changelog}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                this.addOutput(commandsHTML, 'system');

            } catch (error) {
                loadingAnimation.complete();
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-red-400 mr-2">❌</span>
                            <span class="text-red-300 font-medium">Erreur lors du chargement de l'historique</span>
                        </div>
                        <div class="text-red-400 text-sm">${error.message}</div>
                    </div>
                `, 'error');
            }
        },

        cconnect: async function (args) {
            if (!args || args.length === 0 || !args[0].trim()) {
            this.addOutput('Erreur : veuillez fournir un pseudo. Utilisation : cconnect <username>', 'error');
            return;
            }
            const pseudo = args[0].trim();
            this.setPseudoCookie(pseudo);
            
            // Interface améliorée pour la connexion
            const connectionHTML = `
            <div class="border border-green-500 rounded-lg p-4 bg-green-900/20 backdrop-blur-sm mt-3">
                <div class="flex items-center mb-3">
                <span class="text-2xl mr-2">🔗</span>
                <span class="font-bold text-green-400 text-xl">Connexion réussie</span>
                </div>
                <div class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-green-900/30 rounded">
                    <span class="text-green-300 font-medium">Utilisateur:</span>
                    <span class="text-white font-mono font-bold">${pseudo}</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-900/30 rounded">
                    <span class="text-green-300 font-medium">Statut:</span>
                    <span class="text-green-400 font-mono">✅ Connecté</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-900/30 rounded">
                    <span class="text-green-300 font-medium">Session:</span>
                    <span class="text-white font-mono">${new Date().toLocaleString()}</span>
                </div>
                </div>
                <div class="mt-3 text-xs text-gray-400 text-center">
                Titre de la fenêtre mis à jour automatiquement
                </div>
            </div>
            `;
            this.addOutput(connectionHTML, "system");
            this.updatePrompt();
            this.updateWindowTitle();
            this.updatePromptDisplay();
        },

        cdisconnect: async function () {
            const currentPseudo = this.getPseudoFromCookie() || 'user';
            
            // Supprime le cookie pseudo
            document.cookie = "pseudo=;path=/;max-age=0";
            
            // Interface améliorée pour la déconnexion
            const disconnectionHTML = `
            <div class="border border-orange-500 rounded-lg p-4 bg-orange-900/20 backdrop-blur-sm mt-3">
                <div class="flex items-center mb-3">
                <span class="text-2xl mr-2">🔌</span>
                <span class="font-bold text-orange-400 text-xl">Déconnexion</span>
                </div>
                <div class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-orange-900/30 rounded">
                    <span class="text-orange-300 font-medium">Ancien utilisateur:</span>
                    <span class="text-white font-mono line-through">${currentPseudo}</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-900/30 rounded">
                    <span class="text-orange-300 font-medium">Nouvel utilisateur:</span>
                    <span class="text-white font-mono font-bold">user</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-900/30 rounded">
                    <span class="text-orange-300 font-medium">Statut:</span>
                    <span class="text-orange-400 font-mono">⚡ Déconnecté</span>
                </div>
                </div>
                <div class="mt-3 text-xs text-gray-400 text-center">
                Session réinitialisée - Titre de la fenêtre mis à jour
                </div>
            </div>
            `;
            this.addOutput(disconnectionHTML, "system");
            this.updatePrompt();
            this.updateWindowTitle();
            this.updatePromptDisplay();
        },

        history: function () {
            if (this.history.length === 0) {
                this.addOutput('Aucune commande enregistrée.', 'system');
            } else {
                this.openHistoryModal();
            }
        },
        edit(args) {
            if (!args || args.length === 0 || !args[0].trim()) {
                this.addOutput('edit: manque un nom de fichier', 'error');
                return;
            }
            
            const fileName = args[0].trim();
            const targetPath = this.resolvePath(fileName);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
                this.addOutput(`edit: ${fileName}: Aucun fichier de ce type`, 'error');
                return;
            }
            if (targetNode.type !== 'file') {
                this.addOutput(`edit: ${fileName}: N'est pas un fichier`, 'error');
                return;
            }

            this.openRichTextEditor(fileName, targetNode);
        },
        github: async function () {
            const loadingAnimation = this.createLoadingAnimation({
                title: 'Connexion à l\'API GitHub...',
                progressBarColors: 'from-blue-500 to-purple-500',
                steps: [
                    { text: 'Connexion au serveur GitHub...', color: 'text-blue-400', delay: 0 },
                    { text: 'Récupération des données du dépôt...', color: 'text-purple-400', delay: 300 },
                    { text: 'Analyse des informations...', color: 'text-green-400', delay: 600 }
                ]
            });

            try {
                const response = await fetch('https://api.github.com/repos/Klaynight-dev/Web_linux_console');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const repoData = await response.json();

                // Terminer l'animation
                loadingAnimation.complete();

                const githubHTML = `
                <div class="border border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/20 backdrop-blur-sm mt-3">
                    <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-gray-600">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        </div>
                        <div>
                        <h2 class="text-2xl font-bold text-white">${repoData.name}</h2>
                        <p class="text-blue-300 text-sm">${repoData.description || 'Console Linux Web Interactive'}</p>
                        </div>
                    </div>
                    <div class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                        ${repoData.private ? 'Private' : 'Open Source'}
                    </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-blue-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        À propos du projet
                        </h3>
                        <p class="text-gray-300 text-sm leading-relaxed">
                        ${repoData.description || 'Une console Linux interactive entièrement développée en JavaScript. Explorez les commandes Unix/Linux directement dans votre navigateur !'}
                        </p>
                        <div class="flex items-center space-x-4 text-xs text-gray-400">
                        <span>📅 Créé le ${new Date(repoData.created_at).toLocaleDateString('fr-FR')}</span>
                        <span>🔄 Mis à jour le ${new Date(repoData.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <h3 class="text-lg font-semibold text-purple-300 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Fonctionnalités
                        </h3>
                        <ul class="text-gray-300 text-sm space-y-1">
                        <li class="flex items-center"><span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>+${Object.keys(COMMAND_METADATA).length} commandes</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>Système de fichiers virtuel</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>Historique persistant</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>Interface personnalisable</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>Langage: ${repoData.language || 'JavaScript'}</li>
                        <li class="flex items-center"><span class="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>Taille: ${(repoData.size / 1024).toFixed(1)} MB</li>
                        </ul>
                    </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-3 justify-center">
                    <a href="${repoData.html_url}" target="_blank" 
                    class="flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 border border-gray-600 hover:border-gray-500">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span class="font-semibold">Voir le code source</span>
                    </a>
                    
                    <a href="${repoData.html_url}/issues" target="_blank" 
                    class="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="font-semibold">Signaler un bug (${repoData.open_issues})</span>
                    </a>
                    
                    <a href="${repoData.html_url}/fork" target="_blank" 
                    class="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-semibold">Fork le projet</span>
                    </a>
                    
                    ${repoData.clone_url ? `
                    <button onclick="navigator.clipboard.writeText('${repoData.clone_url}').then(() => app.addOutput('URL de clonage copiée!', 'system'))" 
                        class="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-semibold">Copier git clone</span>
                    </button>
                    ` : ''}
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-gray-600">
                    <div class="flex items-center justify-between text-sm text-gray-400">
                        <div class="flex items-center space-x-4">
                        <span>📅 Créé le ${new Date(repoData.created_at).toLocaleDateString('fr-FR')}</span>
                        <span>🔄 Mis à jour le ${new Date(repoData.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div class="text-xs">
                        Made with ❤️ by <a href="${repoData.owner.html_url}" target="_blank" class="text-blue-400 hover:text-blue-300">${repoData.owner.login}</a>
                        </div>
                    </div>
                    </div>
                </div>
                `;
                
                this.addOutput(githubHTML, 'system');

            } catch (error) {
                loadingAnimation.complete();
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-red-400 mr-2">❌</span>
                            <span class="text-red-300 font-medium">Erreur lors de la récupération des données GitHub</span>
                        </div>
                        <div class="text-red-400 text-sm">${error.message}</div>
                        <div class="text-gray-400 text-xs mt-2">
                            Vérifiez votre connexion internet ou que le dépôt existe bien.
                        </div>
                    </div>
                `, 'error');

                // Fallback vers l'affichage statique
                setTimeout(() => {
                    const fallbackHTML = `
                        <div class="border border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/20 backdrop-blur-sm mt-3">
                            <div class="text-center">
                            <div class="w-16 h-16 bg-black rounded-full flex items-center justify-center border-2 border-gray-600 mx-auto mb-4">
                                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </div>
                            <h2 class="text-2xl font-bold text-white mb-2">CLK Console</h2>
                            <p class="text-gray-300 mb-4">Console Linux Web Interactive (Mode hors ligne)</p>
                            <a href="https://github.com/Klaynight-dev/Web_linux_console" target="_blank" 
                            class="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-300">
                                <span class="font-semibold">Visitez le dépôt GitHub</span>
                            </a>
                            </div>
                        </div>
                    `;
                    this.addOutput(fallbackHTML, 'system');
                }, 1000);
            }
        },
        clearHistory: function () {
            this.history = [];
            this.saveHistoryToCookie();
            this.addOutput('<span class="text-green-400">✅ Historique des commandes effacé</span>', 'system');
        },
        resetAllCache: function () {
            // Créer le modal de confirmation
            let modal = document.getElementById('reset-cache-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'reset-cache-modal';
                modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50';
                modal.innerHTML = `
                    <div class="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-red-500 relative">
                        <!-- Bouton fermer -->
                        <button id="reset-close-x" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-150">&times;</button>
                        
                        <!-- Header avec animation -->
                        <div class="flex items-center justify-center mb-6">
                            <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mr-4 animate-pulse">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-red-400 mb-2">RÉINITIALISATION COMPLÈTE</h2>
                                <p class="text-red-300 text-lg">Cette action est IRRÉVERSIBLE !</p>
                            </div>
                        </div>
                        
                        <!-- Données à supprimer -->
                        <div class="bg-red-900/40 border border-red-600/50 rounded-lg p-4 mb-6">
                            <h3 class="text-yellow-300 font-bold text-lg mb-3 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Données qui seront supprimées définitivement :
                            </h3>
                            <div class="grid md:grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">🍪</span>
                                        <span class="text-white text-sm">Tous les cookies</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">📜</span>
                                        <span class="text-white text-sm">Historique des commandes</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">📁</span>
                                        <span class="text-white text-sm">Système de fichiers</span>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">🎨</span>
                                        <span class="text-white text-sm">Paramètres personnalisés</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">🗂️</span>
                                        <span class="text-white text-sm">Onglets et historique</span>
                                    </div>
                                    <div class="flex items-center p-2 bg-red-800/30 rounded">
                                        <span class="text-red-300 mr-2">💾</span>
                                        <span class="text-white text-sm">Stockage local</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Avertissement -->
                        <div class="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/50 rounded-lg p-4 mb-6">
                            <div class="flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-400 mr-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <span class="text-orange-300 font-bold text-lg text-center">
                                    L'application sera complètement réinitialisée à son état initial
                                </span>
                            </div>
                        </div>
                        
                        <!-- Zone de progression (cachée initialement) -->
                        <div id="reset-progress" class="hidden mb-6">
                            <div class="flex items-center justify-center space-x-3 mb-4">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                <span class="text-blue-300 font-bold text-xl">Suppression en cours...</span>
                            </div>
                            <div class="space-y-3">
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-red-400 rounded-full"></div>
                                    <span class="text-gray-300">Suppression des cookies...</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-yellow-400 rounded-full" style="animation-delay: 0.2s"></div>
                                    <span class="text-gray-300">Effacement de l'historique...</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-green-400 rounded-full" style="animation-delay: 0.4s"></div>
                                    <span class="text-gray-300">Réinitialisation du système de fichiers...</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="animate-pulse w-3 h-3 bg-purple-400 rounded-full" style="animation-delay: 0.6s"></div>
                                    <span class="text-gray-300">Nettoyage du stockage local...</span>
                                </div>
                            </div>
                            <div class="mt-4 bg-gray-700 rounded-full h-3">
                                <div id="reset-progress-bar" class="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <!-- Boutons d'action -->
                        <div id="reset-buttons" class="flex items-center justify-center space-x-4">
                            <button id="reset-confirm-btn" class="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Oui, supprimer tout
                            </button>
                            <button id="reset-cancel-btn" class="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                Annuler
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            modal.classList.remove('hidden');
            
            // Gestionnaires d'événements pour les boutons
            const confirmBtn = document.getElementById('reset-confirm-btn');
            const cancelBtn = document.getElementById('reset-cancel-btn');
            const closeBtn = document.getElementById('reset-close-x');
            const buttonsDiv = document.getElementById('reset-buttons');
            const progressDiv = document.getElementById('reset-progress');

            let closeModal = () => {
                modal.classList.add('hidden');
                this.commandInputElement.focus();
            };

            const performReset = () => {
                // Masquer les boutons et afficher la progression
                buttonsDiv.classList.add('hidden');
                progressDiv.classList.remove('hidden');
                
                // Simulation de progression
                let progress = 0;
                const progressBar = document.getElementById('reset-progress-bar');
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 15 + 10;
                    if (progress > 100) progress = 100;
                    if (progressBar) {
                        progressBar.style.width = progress + '%';
                    }
                }, 200);
                
                setTimeout(() => {
                    clearInterval(progressInterval);
                    
                    // Effectuer la réinitialisation
                    try {
                        // Supprimer tous les cookies
                        document.cookie.split(";").forEach(function(c) { 
                            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                        });
                        
                        // Vider localStorage
                        localStorage.clear();
                        
                        // Vider sessionStorage
                        sessionStorage.clear();
                        
                        // Réinitialiser les données de l'application
                        this.history = [];
                        this.tabs = [];
                        this.currentDir = '/home/user';
                        this.fileSystem = {
                            '/': {
                                type: 'directory',
                                children: {
                                    'bin': { type: 'directory', children: {} },
                                    'home': {
                                        type: 'directory',
                                        children: {
                                            'user': {
                                                type: 'directory',
                                                children: {
                                                    'welcome.txt': {
                                                        type: 'file',
                                                        content: 'Bienvenue sur votre console Linux web!'
                                                    },
                                                    'notes.txt': {
                                                        type: 'file',
                                                        content: 'Ceci est un fichier de notes. Utilisez "cat notes.txt" pour le lire.'
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    'etc': {
                                        type: 'directory',
                                        children: {
                                            'motd': { 
                                                type: 'file',
                                                get content() {
                                                    const mots = ["Message du jour : Amusez-vous bien !", "Message du jour : Apprenez quelque chose de nouveau aujourd'hui.", "Message du jour : La persévérance paie toujours.", "Message du jour : Codez avec passion.", "Message du jour : Prenez une pause et respirez.", "Message du jour : La curiosité est une qualité.", "Message du jour : Essayez une nouvelle commande.", "Message du jour : Partagez vos connaissances.", "Message du jour : La simplicité est la sophistication suprême.", "Message du jour : Un bug aujourd'hui, une solution demain.", "Message du jour : La créativité commence par une idée.", "Message du jour : Osez sortir de votre zone de confort.", "Message du jour : La collaboration fait la force.", "Message du jour : Chaque jour est une nouvelle opportunité.", "Message du jour : L'échec est le début du succès.", "Message du jour : Prenez soin de vous.", "Message du jour : La patience est une vertu.", "Message du jour : Faites de votre mieux.", "Message du jour : Le partage, c'est la vie."];
                                                    const now = new Date();
                                                    const start = new Date(now.getFullYear(), 0, 0);
                                                    const diff = now - start;
                                                    const oneDay = 1000 * 60 * 60 * 24;
                                                    const dayOfYear = Math.floor(diff / oneDay);
                                                    return mots[dayOfYear % mots.length];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        };
                        
                        // Populer le répertoire bin
                        this.populateBinDirectory();
                        this.saveFileSystemToCookie();
                        
                        // Réinitialiser les onglets
                        this.tabs = [];
                        this.activeTabId = null;
                        this.nextTabId = 1;
                        this.createFirstTab();
                        
                        // Fermer le modal
                        closeModal();
                        
                        // Vider complètement la console
                        this.clearConsole();
                        
                        // Utiliser la méthode reboot existante pour redémarrer
                        this.commands.reboot.call(this);
                        
                        // Mettre à jour le prompt et remettre le focus
                        this.updatePrompt();
                        this.commandInputElement.focus();
                        
                    } catch (error) {
                        // En cas d'erreur, afficher une notification d'erreur
                        closeModal();
                        this.showNotification({
                            type: 'error',
                            title: '❌ Erreur de réinitialisation',
                            message: 'Une erreur est survenue : ' + error.message,
                            duration: 8000,
                            actions: [
                                {
                                    text: '🔄 Réessayer',
                                    callback: () => {
                                        this.commands.resetAllCache.call(this);
                                    }
                                },
                                {
                                    text: '⚠️ Recharger manuellement',
                                    callback: () => {
                                        window.location.reload();
                                    }
                                }
                            ]
                        });
                    }
                }, 1500);
            };

            // Événements
            confirmBtn.onclick = performReset;
            cancelBtn.onclick = closeModal;
            closeBtn.onclick = closeModal;

            // Fermer en cliquant à l'extérieur
            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            };

            // Support des touches
            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'Enter') {
                    performReset();
                }
            };

            document.addEventListener('keydown', keyHandler);

            // Nettoyer les événements lors de la fermeture
            const originalCloseModal = closeModal;
            closeModal = () => {
                document.removeEventListener('keydown', keyHandler);
                originalCloseModal();
            };
        },
        
        lshw: function () {
            // Affiche les vraies informations matérielles du PC
            const headerHTML = `
                <div class="border border-green-500 rounded-lg p-4 bg-green-900/20 backdrop-blur-sm">
                    <div class="flex items-center mb-3">
                        <span class="text-2xl mr-2">🖥️</span>
                        <span class="font-bold text-green-400 text-xl">Informations matérielles système (lshw)</span>
                    </div>
                    <div class="text-gray-300 text-sm mb-2">Récupération des informations matérielles réelles...</div>
                    <div class="text-yellow-400 text-xs italic">⚠️ Le navigateur étant limité, certaines informations peuvent être erronées ou incomplètes</div>
                </div>
            `;
            this.addOutput(headerHTML, 'system');

            const loadingAnimation = this.createLoadingAnimation({
                title: 'Analyse matérielle en cours...',
                progressBarColors: 'from-green-500 to-blue-500',
                steps: [
                    { text: 'Détection CPU et mémoire...', color: 'text-blue-400', delay: 0 },
                    { text: 'Analyse GPU via WebGL...', color: 'text-purple-400', delay: 300 },
                    { text: 'Inventaire des périphériques...', color: 'text-yellow-400', delay: 600 }
                ]
            });

            // Simulation de l'analyse matérielle
            setTimeout(() => {
                loadingAnimation.complete();
                
                // Fonction pour récupérer les vraies informations matérielles
                const getRealHardwareInfo = async () => {
                    const hwInfo = {};
                    
                    try {
                        const nav = window.navigator;
                        
                        // Informations système de base
                        hwInfo.system = {
                            userAgent: nav.userAgent,
                            platform: nav.platform || 'Inconnu',
                            language: nav.language || 'Inconnu',
                            languages: (nav.languages || []).join(', '),
                            online: navigator.onLine,
                            cookieEnabled: nav.cookieEnabled,
                            doNotTrack: nav.doNotTrack,
                            vendor: nav.vendor,
                            product: nav.product,
                            webdriver: nav.webdriver
                        };

                        // Informations CPU et mémoire
                        hwInfo.cpu = {
                            cores: nav.hardwareConcurrency || 'Inconnu',
                            memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Inconnu'
                        };

                        // Informations d'affichage
                        if (window.screen) {
                            hwInfo.display = {
                                resolution: `${window.screen.width}x${window.screen.height}`,
                                colorDepth: `${window.screen.colorDepth} bits`,
                                orientation: window.screen.orientation ? window.screen.orientation.type : 'Inconnu',
                                pixelRatio: window.devicePixelRatio || 'Inconnu',
                                viewport: `${window.innerWidth}x${window.innerHeight}`
                            };
                        }

                        // Informations tactiles
                        if (nav.maxTouchPoints !== undefined) {
                            hwInfo.touch = {
                                maxPoints: nav.maxTouchPoints,
                                supported: nav.maxTouchPoints > 0
                            };
                        }

                        // Informations réseau
                        if (nav.connection) {
                            const c = nav.connection;
                            hwInfo.network = {
                                type: c.effectiveType || c.type || 'Inconnu',
                                downlink: c.downlink ? `${c.downlink} Mbps` : 'Inconnu',
                                rtt: c.rtt ? `${c.rtt} ms` : 'Inconnu',
                                saveData: c.saveData !== undefined ? (c.saveData ? 'Activé' : 'Désactivé') : 'Inconnu'
                            };
                        }

                        // Informations WebGL/GPU
                        try {
                            const canvas = document.createElement('canvas');
                            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                            if (gl) {
                                hwInfo.gpu = {
                                    version: gl.getParameter(gl.VERSION),
                                    vendor: gl.getParameter(gl.VENDOR),
                                    renderer: gl.getParameter(gl.RENDERER),
                                    shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
                                };

                                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                                if (debugInfo) {
                                    hwInfo.gpu.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                                    hwInfo.gpu.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                                }
                            }
                        } catch (error) {
                            hwInfo.gpu = { error: 'Non accessible' };
                        }

                        // Informations batterie
                        if (navigator.getBattery) {
                            try {
                                const battery = await navigator.getBattery();
                                hwInfo.battery = {
                                    level: `${Math.round(battery.level * 100)}%`,
                                    charging: battery.charging,
                                    chargingTime: battery.chargingTime !== Infinity ? `${Math.round(battery.chargingTime / 60)} min` : 'Indéfini',
                                    dischargingTime: battery.dischargingTime !== Infinity ? `${Math.round(battery.dischargingTime / 60)} min` : 'Indéfini'
                                };
                            } catch (error) {
                                hwInfo.battery = { error: 'Non accessible' };
                            }
                        }

                        // Informations périphériques média
                        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                            try {
                                const devices = await navigator.mediaDevices.enumerateDevices();
                                hwInfo.media = {
                                    audioInputs: devices.filter(d => d.kind === 'audioinput').length,
                                    videoInputs: devices.filter(d => d.kind === 'videoinput').length,
                                    audioOutputs: devices.filter(d => d.kind === 'audiooutput').length
                                };
                            } catch (error) {
                                hwInfo.media = { error: 'Non accessible' };
                            }
                        }

                        // Informations de performance
                        if (window.performance) {
                            hwInfo.performance = {
                                memory: window.performance.memory ? {
                                    usedJSHeapSize: this.formatBytes(window.performance.memory.usedJSHeapSize),
                                    totalJSHeapSize: this.formatBytes(window.performance.memory.totalJSHeapSize),
                                    jsHeapSizeLimit: this.formatBytes(window.performance.memory.jsHeapSizeLimit)
                                } : 'Non disponible',
                                timing: {
                                    loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
                                    domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
                                    networkLatency: window.performance.timing.responseStart - window.performance.timing.fetchStart
                                }
                            };
                        }

                        // Informations de géolocalisation
                        hwInfo.geolocation = {
                            supported: 'geolocation' in navigator,
                            status: navigator.geolocation ? 'Disponible' : 'Non supporté'
                        };

                        // Informations diverses
                        hwInfo.misc = {
                            localStorage: typeof Storage !== 'undefined',
                            sessionStorage: typeof sessionStorage !== 'undefined',
                            webWorkers: typeof Worker !== 'undefined',
                            serviceWorkers: 'serviceWorker' in navigator,
                            notifications: 'Notification' in window,
                            permissions: 'permissions' in navigator,
                            vibration: 'vibrate' in navigator,
                            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled,
                            clipboard: navigator.clipboard !== undefined,
                            share: navigator.share !== undefined
                        };

                        return hwInfo;

                    } catch (error) {
                        console.error('Erreur récupération matériel:', error);
                        return {};
                    }
                };

                // Exécution et affichage avec le nouveau constructeur
                getRealHardwareInfo().then(hwInfo => {
                    if (Object.keys(hwInfo).length === 0) {
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                                <span class="text-red-400">❌ Impossible de récupérer les informations matérielles</span>
                            </div>
                        `, 'system');
                        return;
                    }

                    let output = '';

                    // Système de base
                    if (hwInfo.system) {
                        output += this.createInfoBlock({
                            title: 'Système',
                            icon: '💻',
                            color: 'text-blue-400',
                            items: [
                                { label: 'Plateforme', value: hwInfo.system.platform, labelColor: 'text-blue-300' },
                                { label: 'Langue', value: hwInfo.system.language, labelColor: 'text-green-300' },
                                { label: 'Navigateur', value: hwInfo.system.vendor || 'Inconnu', labelColor: 'text-purple-300' },
                                { label: 'En ligne', value: hwInfo.system.online ? 'Oui' : 'Non', labelColor: 'text-yellow-300' },
                                { label: 'Cookies', value: hwInfo.system.cookieEnabled ? 'Activés' : 'Désactivés', labelColor: 'text-cyan-300' }
                            ]
                        });
                    }

                    // CPU et Mémoire
                    if (hwInfo.cpu) {
                        output += this.createInfoBlock({
                            title: 'Processeur & Mémoire',
                            icon: '🧠',
                            color: 'text-cyan-400',
                            itemBgColor: 'bg-blue-900/30',
                            items: [
                                { label: 'Cœurs CPU', value: hwInfo.cpu.cores, labelColor: 'text-cyan-300' },
                                { label: 'RAM estimée', value: hwInfo.cpu.memory, labelColor: 'text-cyan-300' }
                            ]
                        });
                    }

                    // Affichage
                    if (hwInfo.display) {
                        output += this.createInfoBlock({
                            title: 'Affichage',
                            icon: '🖥️',
                            color: 'text-purple-400',
                            itemBgColor: 'bg-purple-900/30',
                            items: [
                                { label: 'Résolution', value: hwInfo.display.resolution, labelColor: 'text-purple-300' },
                                { label: 'Profondeur couleur', value: hwInfo.display.colorDepth, labelColor: 'text-purple-300' },
                                { label: 'Pixel Ratio', value: hwInfo.display.pixelRatio, labelColor: 'text-purple-300' },
                                { label: 'Fenêtre visible', value: hwInfo.display.viewport, labelColor: 'text-purple-300' },
                                { label: 'Orientation', value: hwInfo.display.orientation, labelColor: 'text-purple-300' }
                            ]
                        });
                    }

                    // GPU
                    if (hwInfo.gpu && !hwInfo.gpu.error) {
                        const gpuItems = [
                            { label: 'WebGL Version', value: hwInfo.gpu.version, labelColor: 'text-red-300' },
                            { label: 'Shading Language', value: hwInfo.gpu.shadingLanguage, labelColor: 'text-red-300' },
                            { label: 'Vendor (masqué)', value: hwInfo.gpu.vendor, labelColor: 'text-red-300' },
                            { label: 'Renderer (masqué)', value: hwInfo.gpu.renderer, labelColor: 'text-red-300' }
                        ];

                        // Ajouter les infos non masquées si disponibles
                        if (hwInfo.gpu.unmaskedVendor) {
                            gpuItems.unshift({ label: 'Fabricant', value: hwInfo.gpu.unmaskedVendor, labelColor: 'text-red-300' });
                        }
                        if (hwInfo.gpu.unmaskedRenderer) {
                            gpuItems.splice(hwInfo.gpu.unmaskedVendor ? 1 : 0, 0, 
                                { label: 'Modèle', value: hwInfo.gpu.unmaskedRenderer, labelColor: 'text-red-300' }
                            );
                        }

                        output += this.createInfoBlock({
                            title: 'Carte Graphique (WebGL)',
                            icon: '🎮',
                            color: 'text-red-400',
                            itemBgColor: 'bg-red-900/30',
                            items: gpuItems
                        });
                    }

                    // Réseau
                    if (hwInfo.network) {
                        output += this.createInfoBlock({
                            title: 'Réseau',
                            icon: '🌐',
                            color: 'text-yellow-400',
                            itemBgColor: 'bg-yellow-900/30',
                            items: [
                                { label: 'Type connexion', value: hwInfo.network.type, labelColor: 'text-yellow-300' },
                                { label: 'Débit estimé', value: hwInfo.network.downlink, labelColor: 'text-yellow-300' },
                                { label: 'Latence', value: hwInfo.network.rtt, labelColor: 'text-yellow-300' },
                                { label: 'Économie données', value: hwInfo.network.saveData, labelColor: 'text-yellow-300' }
                            ]
                        });
                    }

                    // Batterie
                    if (hwInfo.battery && !hwInfo.battery.error) {
                        const batteryItems = [
                            { label: 'Niveau', value: hwInfo.battery.level, labelColor: 'text-orange-300' },
                            { label: 'En charge', value: hwInfo.battery.charging ? 'Oui' : 'Non', labelColor: 'text-orange-300' }
                        ];

                        if (hwInfo.battery.chargingTime !== 'Indéfini') {
                            batteryItems.push({ label: 'Temps charge', value: hwInfo.battery.chargingTime, labelColor: 'text-orange-300' });
                        }
                        if (hwInfo.battery.dischargingTime !== 'Indéfini') {
                            batteryItems.push({ label: 'Autonomie', value: hwInfo.battery.dischargingTime, labelColor: 'text-orange-300' });
                        }

                        output += this.createInfoBlock({
                            title: 'Batterie',
                            icon: '🔋',
                            color: 'text-orange-400',
                            itemBgColor: 'bg-orange-900/30',
                            items: batteryItems
                        });
                    }

                    // Périphériques média
                    if (hwInfo.media && !hwInfo.media.error) {
                        output += this.createInfoBlock({
                            title: 'Périphériques Média',
                            icon: '🎤',
                            color: 'text-pink-400',
                            itemBgColor: 'bg-pink-900/30',
                            items: [
                                { label: 'Microphones', value: hwInfo.media.audioInputs, labelColor: 'text-pink-300' },
                                { label: 'Caméras', value: hwInfo.media.videoInputs, labelColor: 'text-pink-300' },
                                { label: 'Haut-parleurs', value: hwInfo.media.audioOutputs, labelColor: 'text-pink-300' }
                            ]
                        });
                    }

                    // Interface tactile
                    if (hwInfo.touch) {
                        output += this.createInfoBlock({
                            title: 'Interface Tactile',
                            icon: '👆',
                            color: 'text-teal-400',
                            itemBgColor: 'bg-teal-900/30',
                            items: [
                                { label: 'Points tactiles max', value: hwInfo.touch.maxPoints, labelColor: 'text-teal-300' },
                                { label: 'Support tactile', value: hwInfo.touch.supported ? 'Oui' : 'Non', labelColor: 'text-teal-300' }
                            ]
                        });
                    }

                    // Performance
                    if (hwInfo.performance) {
                        const perfItems = [];
                        
                        if (hwInfo.performance.memory !== 'Non disponible') {
                            perfItems.push(
                                { label: 'Mémoire JS utilisée', value: hwInfo.performance.memory.usedJSHeapSize, labelColor: 'text-green-300' },
                                { label: 'Mémoire JS totale', value: hwInfo.performance.memory.totalJSHeapSize, labelColor: 'text-green-300' },
                                { label: 'Limite mémoire JS', value: hwInfo.performance.memory.jsHeapSizeLimit, labelColor: 'text-green-300' }
                            );
                        }
                        
                        perfItems.push(
                            { label: 'Temps de chargement', value: `${hwInfo.performance.timing.loadTime} ms`, labelColor: 'text-green-300' },
                            { label: 'DOM prêt en', value: `${hwInfo.performance.timing.domContentLoaded} ms`, labelColor: 'text-green-300' },
                            { label: 'Latence réseau', value: `${hwInfo.performance.timing.networkLatency} ms`, labelColor: 'text-green-300' }
                        );

                        output += this.createInfoBlock({
                            title: 'Performance & Mémoire JS',
                            icon: '⚡',
                            color: 'text-green-400',
                            itemBgColor: 'bg-green-900/30',
                            items: perfItems
                        });
                    }

                    // Capacités diverses (en grille)
                    if (hwInfo.misc) {
                        const miscHTML = `
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">localStorage:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.localStorage ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">sessionStorage:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.sessionStorage ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Web Workers:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.webWorkers ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Service Workers:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.serviceWorkers ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Notifications:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.notifications ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Permissions:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.permissions ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Vibration:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.vibration ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Fullscreen:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.fullscreen ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Clipboard:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.clipboard ? '✅' : '❌'}</span>
                                </div>
                                <div class="flex justify-between p-2 bg-indigo-900/30 rounded">
                                    <span class="text-indigo-300 font-medium">Web Share:</span>
                                    <span class="text-white font-mono">${hwInfo.misc.share ? '✅' : '❌'}</span>
                                </div>
                            </div>
                        `;

                        output += this.createInfoBlock({
                            title: 'Capacités & APIs',
                            icon: '🔧',
                            color: 'text-indigo-400',
                            items: [], // Pas d'items standards
                            customHTML: miscHTML
                        });
                    }

                    // Géolocalisation
                    if (hwInfo.geolocation) {
                        output += this.createInfoBlock({
                            title: 'Géolocalisation',
                            icon: '📍',
                            color: 'text-emerald-400',
                            itemBgColor: 'bg-emerald-900/30',
                            items: [
                                { label: 'Support', value: hwInfo.geolocation.supported ? 'Oui' : 'Non', labelColor: 'text-emerald-300' },
                                { label: 'Statut', value: hwInfo.geolocation.status, labelColor: 'text-emerald-300' }
                            ]
                        });
                    }

                    // Message de succès
                    const successHTML = `
                        <div class="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                            <div class="flex items-center">
                                <span class="text-green-400 mr-2">✅</span>
                                <span class="text-green-300 font-medium">Analyse matérielle terminée avec succès</span>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                Les informations sont limitées par le navigateur pour des raisons de sécurité et de confidentialité.
                            </div>
                        </div>
                    `;

                    this.addOutput(output + successHTML, 'system');
                }).catch(error => {
                    this.addOutput(`
                        <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                            <span class="text-red-400">❌ Erreur lors de la récupération des informations matérielles: ${error.message}</span>
                        </div>
                    `, 'error');
                });
            }, 10);
        },

        ifconfig: function () {
            // Affiche les vraies informations réseau du PC
            const headerHTML = `
                <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                    <div class="flex items-center mb-3">
                        <span class="text-2xl mr-2">🌐</span>
                        <span class="font-bold text-blue-400 text-xl">Configuration réseau système (ifconfig)</span>
                    </div>
                    <div class="text-gray-300 text-sm mb-2">Récupération des informations réseau réelles...</div>
                    <div class="text-yellow-400 text-xs italic">⚠️ Le navigateur étant limité, certaines informations peuvent être erronées ou incomplètes</div>
                </div>
            `;
            this.addOutput(headerHTML, 'system');

            const loadingAnimation = this.createLoadingAnimation({
                title: 'Analyse des interfaces réseau en cours...',
                progressBarColors: 'from-blue-500 to-green-500',
                steps: [
                    { text: 'Récupération IP publique...', color: 'text-green-400', delay: 0 },
                    { text: 'Détection des IPs locales via WebRTC...', color: 'text-yellow-400', delay: 300 },
                    { text: 'Analyse des capacités réseau...', color: 'text-purple-400', delay: 600 }
                ]
            });

            // Simulation de l'analyse réseau
            setTimeout(() => {
                loadingAnimation.complete();
                
                // Fonction pour récupérer les vraies informations réseau
                const getRealNetworkInfo = async () => {
                    const interfaces = [];
                    
                    try {
                        // Utilise l'API Navigator pour récupérer des infos réelles
                        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                        
                        // Interface principale (WiFi/Ethernet)
                        const mainInterface = {
                            name: 'eth0',
                            type: connection ? (connection.type || 'ethernet') : 'ethernet',
                            state: navigator.onLine ? 'UP RUNNING' : 'DOWN',
                            speed: connection ? connection.downlink : null,
                            effectiveType: connection ? connection.effectiveType : null,
                            rtt: connection ? connection.rtt : null
                        };

                        // Récupération de l'IP publique réelle
                        try {
                            const publicResponse = await fetch('https://httpbin.org/ip');
                            const publicData = await publicResponse.json();
                            mainInterface.publicIP = publicData.origin;
                        } catch {
                            // Fallback vers un autre service
                            try {
                                const fallbackResponse = await fetch('https://api64.ipify.org?format=json');
                                const fallbackData = await fallbackResponse.json();
                                mainInterface.publicIP = fallbackData.ip;
                            } catch {
                                mainInterface.publicIP = 'Non accessible';
                            }
                        }

                        // Récupération des IPs locales via WebRTC (plus précise)
                        const localIPs = await new Promise((resolve) => {
                            const ips = new Set();
                            const rtc = new RTCPeerConnection({
                                iceServers: [
                                    { urls: 'stun:stun.l.google.com:19302' },
                                    { urls: 'stun:stun1.l.google.com:19302' }
                                ]
                            });

                            rtc.createDataChannel('');
                            rtc.onicecandidate = (e) => {
                                if (e.candidate) {
                                    const parts = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
                                    if (parts && parts[1] && parts[1] !== '127.0.0.1') {
                                        ips.add(parts[1]);
                                    }
                                }
                            };

                            rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
                            
                            setTimeout(() => {
                                rtc.close();
                                resolve(Array.from(ips));
                            }, 100);
                        });

                        mainInterface.localIPs = localIPs;

                        // Récupération d'informations système via Battery API
                        if ('getBattery' in navigator) {
                            try {
                                const battery = await navigator.getBattery();
                                mainInterface.powerInfo = {
                                    charging: battery.charging,
                                    level: Math.round(battery.level * 100),
                                    chargingTime: battery.chargingTime,
                                    dischargingTime: battery.dischargingTime
                                };
                            } catch {}
                        }

                        // Informations sur les capacités réseau
                        if ('serviceWorker' in navigator) {
                            mainInterface.serviceWorkerSupport = true;
                        }

                        interfaces.push(mainInterface);

                        // Interface de bouclage (simulation réaliste)
                        interfaces.push({
                            name: 'lo',
                            type: 'loopback',
                            state: 'UP LOOPBACK RUNNING',
                            ip: '127.0.0.1',
                            netmask: '255.0.0.0',
                            mtu: 65536
                        });

                        return interfaces;

                    } catch (error) {
                        console.error('Erreur récupération réseau:', error);
                        return [];
                    }
                };

                // Exécution et affichage avec le constructeur createInfoBlock
                getRealNetworkInfo().then(interfaces => {
                    if (interfaces.length === 0) {
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                                <span class="text-red-400">❌ Impossible de récupérer les informations réseau système</span>
                            </div>
                        `, 'system');
                        return;
                    }

                    let output = '';
                    
                    // Traiter chaque interface
                    interfaces.forEach(iface => {
                        if (iface.name === 'eth0') {
                            // Interface principale Ethernet
                            const eth0Items = [];
                            
                            // Ajouter l'IP publique si disponible
                            if (iface.publicIP) {
                                eth0Items.push({ 
                                    label: 'IP Publique', 
                                    value: iface.publicIP, 
                                    labelColor: 'text-blue-300' 
                                });
                            }

                            // Ajouter les IPs locales
                            if (iface.localIPs && iface.localIPs.length > 0) {
                                iface.localIPs.forEach((ip, index) => {
                                    eth0Items.push({ 
                                        label: `IP Locale ${index + 1}`, 
                                        value: `${ip}/24`, 
                                        labelColor: 'text-green-300' 
                                    });
                                });
                            }

                            // Ajouter les informations de connexion
                            if (iface.speed) {
                                eth0Items.push({ 
                                    label: 'Débit', 
                                    value: `${iface.speed} Mbps`, 
                                    labelColor: 'text-yellow-300' 
                                });
                            }

                            if (iface.effectiveType) {
                                eth0Items.push({ 
                                    label: 'Type de connexion', 
                                    value: iface.effectiveType, 
                                    labelColor: 'text-purple-300' 
                                });
                            }

                            if (iface.rtt) {
                                eth0Items.push({ 
                                    label: 'Latence RTT', 
                                    value: `${iface.rtt} ms`, 
                                    labelColor: 'text-cyan-300' 
                                });
                            }

                            // Ajouter les informations de batterie si disponibles
                            if (iface.powerInfo) {
                                eth0Items.push({ 
                                    label: 'Batterie', 
                                    value: `${iface.powerInfo.level}% ${iface.powerInfo.charging ? '(en charge)' : ''}`, 
                                    labelColor: 'text-orange-300',
                                    bgColor: 'bg-orange-900/30'
                                });
                            }

                            // MTU standard pour ethernet
                            eth0Items.push({ 
                                label: 'MTU', 
                                value: '1500', 
                                labelColor: 'text-gray-300' 
                            });

                            // Créer le bloc pour eth0 avec badge de statut
                            const statusBadgeHTML = `
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="text-lg mr-2">🌐</span>
                                        <span class="font-bold text-green-400 text-lg">${iface.name}</span>
                                        <span class="ml-2 text-gray-400 text-sm">(${iface.type})</span>
                                    </div>
                                    <span class="px-2 py-1 ${iface.state.includes('UP') ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'} rounded text-xs font-semibold">
                                        ${iface.state}
                                    </span>
                                </div>
                            `;

                            output += this.createInfoBlock({
                                title: '', // Pas de titre car on utilise le HTML personnalisé en haut
                                icon: '',
                                color: 'text-green-400',
                                items: eth0Items,
                                customHTML: statusBadgeHTML
                            });

                        } else if (iface.name === 'lo') {
                            // Interface de bouclage
                            const loItems = [
                                { label: 'IP', value: iface.ip, labelColor: 'text-green-300' },
                                { label: 'Netmask', value: iface.netmask, labelColor: 'text-blue-300' },
                                { label: 'MTU', value: iface.mtu.toString(), labelColor: 'text-gray-300' }
                            ];

                            const loStatusBadgeHTML = `
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="text-lg mr-2">🔄</span>
                                        <span class="font-bold text-blue-400 text-lg">${iface.name}</span>
                                        <span class="ml-2 text-gray-400 text-sm">(${iface.type})</span>
                                    </div>
                                    <span class="px-2 py-1 ${iface.state.includes('UP') ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'} rounded text-xs font-semibold">
                                        ${iface.state}
                                    </span>
                                </div>
                            `;

                            output += this.createInfoBlock({
                                title: '',
                                icon: '',
                                color: 'text-blue-400',
                                items: loItems,
                                customHTML: loStatusBadgeHTML
                            });
                        }
                    });

                    // Bloc d'informations système additionnelles
                    const systemItems = [
                        { label: 'Platform', value: navigator.platform, labelColor: 'text-blue-300' },
                        { label: 'Cores CPU', value: navigator.hardwareConcurrency || 'Inconnu', labelColor: 'text-green-300' },
                        { label: 'RAM estimée', value: `${navigator.deviceMemory || 'Inconnu'} GB`, labelColor: 'text-purple-300' },
                        { label: 'Résolution', value: `${screen.width}x${screen.height}`, labelColor: 'text-yellow-300' }
                    ];

                    const userAgentHTML = `
                        <div class="mt-2 p-2 bg-gray-700/30 rounded">
                            <span class="text-cyan-300 font-medium text-sm">User Agent:</span>
                            <div class="text-white font-mono text-xs mt-1 break-all">${navigator.userAgent.substring(0, 120)}...</div>
                        </div>
                    `;

                    output += this.createInfoBlock({
                        title: 'Informations système',
                        icon: '🖥️',
                        color: 'text-blue-300',
                        itemBgColor: 'bg-gray-700/20',
                        borderColor: 'border-gray-600',
                        items: systemItems,
                        customHTML: userAgentHTML
                    });

                    // Message de succès
                    const successHTML = `
                        <div class="mt-3 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                            <div class="flex items-center">
                                <span class="text-green-400 mr-2">✅</span>
                                <span class="text-green-300 font-medium">Analyse des interfaces réseau terminée avec succès</span>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                Toutes les interfaces réseau disponibles ont été détectées et analysées.
                            </div>
                        </div>
                    `;

                    this.addOutput(output + successHTML, 'system');
                }).catch(error => {
                    this.addOutput(`
                        <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                            <span class="text-red-400">❌ Erreur lors de la récupération des informations réseau: ${error.message}</span>
                        </div>
                    `, 'error');
                });
            }, 100);
        },

        free(args) {
            const options = this.parseOptions(args, {
            'h': 'human-readable',
            'b': 'bytes',
            'm': 'mega',
            'g': 'giga'
            });

            // Simulation des informations mémoire basée sur navigator.deviceMemory
            const totalMemGB = navigator.deviceMemory || 8; // Par défaut 8GB
            const totalMemMB = totalMemGB * 1024;
            const totalMemKB = totalMemMB * 1024;
            const totalMemB = totalMemKB * 1024;

            // Simulation d'utilisation (70% occupé)
            const usedPercent = 0.7;
            const usedMemB = Math.floor(totalMemB * usedPercent);
            const freeMemB = totalMemB - usedMemB;
            const availableMemB = Math.floor(freeMemB * 0.8);

            let unit = 'KB';
            let divisor = 1024;
            let totalMem = totalMemKB;
            let usedMem = Math.floor(usedMemB / 1024);
            let freeMem = Math.floor(freeMemB / 1024);
            let availableMem = Math.floor(availableMemB / 1024);

            if (options['human-readable']) {
            if (totalMemGB >= 1) {
                unit = 'G';
                divisor = 1024 * 1024 * 1024;
                totalMem = (totalMemB / divisor).toFixed(1);
                usedMem = (usedMemB / divisor).toFixed(1);
                freeMem = (freeMemB / divisor).toFixed(1);
                availableMem = (availableMemB / divisor).toFixed(1);
            } else {
                unit = 'M';
                divisor = 1024 * 1024;
                totalMem = Math.floor(totalMemB / divisor);
                usedMem = Math.floor(usedMemB / divisor);
                freeMem = Math.floor(freeMemB / divisor);
                availableMem = Math.floor(availableMemB / divisor);
            }
            } else if (options.bytes) {
            unit = 'B';
            totalMem = totalMemB;
            usedMem = usedMemB;
            freeMem = freeMemB;
            availableMem = availableMemB;
            } else if (options.mega) {
            unit = 'M';
            divisor = 1024 * 1024;
            totalMem = Math.floor(totalMemB / divisor);
            usedMem = Math.floor(usedMemB / divisor);
            freeMem = Math.floor(freeMemB / divisor);
            availableMem = Math.floor(availableMemB / divisor);
            } else if (options.giga) {
            unit = 'G';
            divisor = 1024 * 1024 * 1024;
            totalMem = (totalMemB / divisor).toFixed(1);
            usedMem = (usedMemB / divisor).toFixed(1);
            freeMem = (freeMemB / divisor).toFixed(1);
            availableMem = (availableMemB / divisor).toFixed(1);
            }

            // En-tête avec icône et titre
            const headerHTML = `
            <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm mb-3">
                <div class="flex items-center mb-2">
                <span class="text-2xl mr-2">🧠</span>
                <span class="font-bold text-blue-400 text-xl">Utilisation mémoire système (free)</span>
                </div>
                <div class="text-gray-300 text-sm">Affichage des informations de mémoire vive et swap</div>
            </div>
            `;
            this.addOutput(headerHTML, 'system');

            // Calcul des pourcentages pour les barres de progression
            const memUsedPercent = (usedMem / totalMem * 100);
            const memAvailablePercent = (availableMem / totalMem * 100);

            // Tableau stylisé avec des cartes
            const memoryHTML = `
            <div class="space-y-4">
                <!-- Mémoire RAM -->
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                <div class="flex items-center mb-3">
                    <span class="text-lg mr-2">💾</span>
                    <span class="font-bold text-green-400 text-lg">Mémoire RAM</span>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Total</div>
                    <div class="text-lg font-mono text-white">${totalMem}${unit}</div>
                    </div>
                    <div class="bg-red-900/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Utilisé</div>
                    <div class="text-lg font-mono text-red-300">${usedMem}${unit}</div>
                    </div>
                    <div class="bg-green-900/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Libre</div>
                    <div class="text-lg font-mono text-green-300">${freeMem}${unit}</div>
                    </div>
                    <div class="bg-blue-900/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Disponible</div>
                    <div class="text-lg font-mono text-blue-300">${availableMem}${unit}</div>
                    </div>
                </div>

                <!-- Barre de progression RAM -->
                <div class="mb-2">
                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Utilisation: ${memUsedPercent.toFixed(1)}%</span>
                    <span>Disponible: ${memAvailablePercent.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500" style="width: ${memUsedPercent}%"></div>
                    </div>
                </div>
                
                <div class="text-xs text-gray-400 text-center">
                    ${memUsedPercent < 50 ? '✅ Utilisation normale' : 
                      memUsedPercent < 80 ? '⚠️ Utilisation modérée' : 
                      '🔴 Utilisation élevée'}
                </div>
                </div>

                <!-- Mémoire SWAP -->
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                <div class="flex items-center mb-3">
                    <span class="text-lg mr-2">💿</span>
                    <span class="font-bold text-purple-400 text-lg">Mémoire SWAP</span>
                </div>
                
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Total</div>
                    <div class="text-lg font-mono text-white">0${unit}</div>
                    </div>
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Utilisé</div>
                    <div class="text-lg font-mono text-gray-300">0${unit}</div>
                    </div>
                    <div class="bg-gray-700/30 rounded p-3 text-center">
                    <div class="text-xs text-gray-400 mb-1">Libre</div>
                    <div class="text-lg font-mono text-gray-300">0${unit}</div>
                    </div>
                </div>

                <div class="text-xs text-gray-400 text-center">
                    ℹ️ Aucune mémoire SWAP configurée
                </div>
                </div>

                <!-- Informations additionnelles -->
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/30">
                <div class="text-xs text-gray-400 space-y-1">
                    <div><span class="text-yellow-300">•</span> Mémoire détectée via Navigator API: ${navigator.deviceMemory || 'Non disponible'} GB</div>
                    <div><span class="text-blue-300">•</span> Shared/Buffer/Cache: Non applicable dans le navigateur</div>
                    <div><span class="text-green-300">•</span> Utilisation simulée à ${(usedPercent * 100).toFixed(0)}% pour démonstration</div>
                </div>
                </div>
            </div>
            `;

            this.addOutput(memoryHTML, 'system');
        },

        cookies(args) {
            const options = this.parseOptions(args, {
            'a': 'all',
            'c': 'count',
            's': 'size',
            'l': 'list',
            'd': 'delete'
            });

            if (args.length > 0 && args[0] === '--help') {
                this.commands.man.call(this, ['cookies']);
                return;
            }

            // Récupération des cookies ET du localStorage
            const cookies = document.cookie.split(';').filter(cookie => cookie.trim() !== '');
            const localStorageData = {};
            const sessionStorageData = {};
            
            // Récupération du localStorage
            for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            localStorageData[key] = value;
            }
            
            // Récupération du sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            sessionStorageData[key] = value;
            }

            const cookieCount = cookies.length;
            const localStorageCount = Object.keys(localStorageData).length;
            const sessionStorageCount = Object.keys(sessionStorageData).length;
            const totalDataCount = cookieCount + localStorageCount + sessionStorageCount;

            // Calcul des tailles
            let cookiesTotalSize = 0;
            let localStorageTotalSize = 0;
            let sessionStorageTotalSize = 0;
            
            const cookieDetails = [];
            const localStorageDetails = [];
            const sessionStorageDetails = [];

            // Traitement des cookies
            cookies.forEach(cookie => {
            const trimmedCookie = cookie.trim();
            const [name, ...valueParts] = trimmedCookie.split('=');
            const value = valueParts.join('=');
            const size = new Blob([trimmedCookie]).size;
            
            cookiesTotalSize += size;
            cookieDetails.push({
            name: name?.trim() || 'Inconnu',
            value: value || '',
            size: size,
            length: trimmedCookie.length
            });
            });

            // Traitement du localStorage
            Object.entries(localStorageData).forEach(([key, value]) => {
            const size = new Blob([key + value]).size;
            localStorageTotalSize += size;
            localStorageDetails.push({
            name: key,
            value: value,
            size: size,
            length: (key + value).length
            });
            });

            // Traitement du sessionStorage
            Object.entries(sessionStorageData).forEach(([key, value]) => {
            const size = new Blob([key + value]).size;
            sessionStorageTotalSize += size;
            sessionStorageDetails.push({
            name: key,
            value: value,
            size: size,
            length: (key + value).length
            });
            });

            const totalSize = cookiesTotalSize + localStorageTotalSize + sessionStorageTotalSize;

            // Options spécifiques
            if (options.count) {
            this.addOutput(`${cookieCount} cookies, ${localStorageCount} localStorage, ${sessionStorageCount} sessionStorage`);
            this.addOutput(`Total: ${totalDataCount} éléments stockés`);
            return;
            }

            if (options.size) {
            this.addOutput(`Cookies: ${this.formatBytes(cookiesTotalSize)}`);
            this.addOutput(`localStorage: ${this.formatBytes(localStorageTotalSize)}`);
            this.addOutput(`sessionStorage: ${this.formatBytes(sessionStorageTotalSize)}`);
            this.addOutput(`Taille totale: ${this.formatBytes(totalSize)}`);
            return;
            }

            if (options.list) {
            this.addOutput('<span class="font-bold text-blue-400">Liste des données stockées:</span>');
            
            if (cookieCount > 0) {
            this.addOutput('<span class="text-green-400 font-semibold">🍪 Cookies:</span>');
            cookieDetails.forEach((cookie, index) => {
            this.addOutput(`  ${index + 1}. <span class="text-green-400">${cookie.name}</span>`);
            });
            }
            
            if (localStorageCount > 0) {
            this.addOutput('<span class="text-purple-400 font-semibold">💾 localStorage:</span>');
            localStorageDetails.forEach((item, index) => {
            this.addOutput(`  ${index + 1}. <span class="text-purple-400">${item.name}</span>`);
            });
            }
            
            if (sessionStorageCount > 0) {
            this.addOutput('<span class="text-yellow-400 font-semibold">⚡ sessionStorage:</span>');
            sessionStorageDetails.forEach((item, index) => {
            this.addOutput(`  ${index + 1}. <span class="text-yellow-400">${item.name}</span>`);
            });
            }
            
            if (totalDataCount === 0) {
            this.addOutput('<span class="text-gray-400">Aucune donnée trouvée</span>');
            }
            return;
            }

            if (options.delete) {
            this.addOutput('<span class="text-red-400 font-bold">⚠️ ATTENTION ⚠️</span>');
            this.addOutput('<span class="text-yellow-400">Cette action va supprimer TOUTES les données stockées !</span>');
            this.addOutput('<span class="text-red-400">Cela inclut cookies, localStorage et sessionStorage.</span>');
            this.addOutput('<span class="text-red-400">L\'application perdra tous ses paramètres et données.</span>');
            this.addOutput('');
            this.addOutput('Données qui seront supprimées:');
            
            if (cookieCount > 0) {
            this.addOutput('<span class="text-green-400">🍪 Cookies:</span>');
            cookieDetails.forEach(cookie => {
            this.addOutput(`  • <span class="text-gray-300">${cookie.name}</span>`);
            });
            }
            
            if (localStorageCount > 0) {
            this.addOutput('<span class="text-purple-400">💾 localStorage:</span>');
            localStorageDetails.forEach(item => {
            this.addOutput(`  • <span class="text-gray-300">${item.name}</span>`);
            });
            }
            
            if (sessionStorageCount > 0) {
            this.addOutput('<span class="text-yellow-400">⚡ sessionStorage:</span>');
            sessionStorageDetails.forEach(item => {
            this.addOutput(`  • <span class="text-gray-300">${item.name}</span>`);
            });
            }
            
            this.addOutput('');
            this.addOutput('<span class="text-white">Voulez-vous vraiment continuer ? Tapez "cookies --confirm-delete" pour confirmer.</span>');
            return;
            }

            if (args.includes('--confirm-delete')) {
            // Suppression effective de toutes les données
            cookies.forEach(cookie => {
            const name = cookie.trim().split('=')[0];
            document.cookie = `${name}=;path=/;max-age=0`;
            });
            localStorage.clear();
            sessionStorage.clear();
            
            this.addOutput('<span class="text-green-400">✅ Toutes les données ont été supprimées</span>');
            this.addOutput('<span class="text-yellow-400">⚠️ Rechargez la page pour voir les effets complets</span>');
            return;
            }

            // Affichage par défaut ou avec --all
            const headerHTML = `
            <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
            <div class="flex items-center mb-3">
            <span class="text-2xl mr-2">💾</span>
            <span class="font-bold text-blue-400 text-xl">Gestion des données navigateur</span>
            </div>
            <div class="text-gray-300 text-sm">Analyse complète des données stockées (cookies, localStorage, sessionStorage)</div>
            </div>
            `;
            this.addOutput(headerHTML, 'system');

            // Statistiques générales
            const statsHTML = `
            <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
            <div class="flex items-center mb-3">
            <span class="text-lg mr-2">📊</span>
            <span class="font-bold text-green-400 text-lg">Statistiques globales</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">🍪 Cookies</div>
                <div class="text-2xl font-mono text-green-300">${cookieCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(cookiesTotalSize)}</div>
            </div>
            <div class="bg-purple-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">💾 localStorage</div>
                <div class="text-2xl font-mono text-purple-300">${localStorageCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(localStorageTotalSize)}</div>
            </div>
            <div class="bg-yellow-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">⚡ sessionStorage</div>
                <div class="text-2xl font-mono text-yellow-300">${sessionStorageCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(sessionStorageTotalSize)}</div>
            </div>
            <div class="bg-blue-900/30 rounded p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">📦 Total</div>
                <div class="text-2xl font-mono text-blue-300">${totalDataCount}</div>
                <div class="text-xs text-gray-400">${this.formatBytes(totalSize)}</div>
            </div>
            </div>
            </div>
            `;
            this.addOutput(statsHTML, 'system');

            if (totalDataCount === 0) {
            this.addOutput(`
            <div class="mt-3 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
            <span class="text-yellow-400">ℹ️ Aucune donnée trouvée sur ce site</span>
            </div>
            `, 'system');
            return;
            }

            // Fonction helper pour créer une section déroulante avec les détails
            const createDropdownSection = (title, icon, data, color, sectionId) => {
            if (data.length === 0) return '';
            
            const uniqueId = `cookies-dropdown-${sectionId}-${Date.now()}`;
            
            let html = `
                <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-3">
                <div class="flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors duration-200 p-2 rounded" onclick="
                    const content = document.getElementById('${uniqueId}');
                    const arrow = document.getElementById('${uniqueId}-arrow');
                    if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    arrow.innerHTML = '▼';
                    } else {
                    content.style.display = 'none';
                    arrow.innerHTML = '▶';
                    }
                ">
                    <div class="flex items-center">
                    <span class="text-lg mr-2">${icon}</span>
                    <span class="font-bold ${color} text-lg">${title} (${data.length})</span>
                    </div>
                    <span id="${uniqueId}-arrow" class="text-gray-400 text-sm transition-transform">▶</span>
                </div>
                
                <div id="${uniqueId}" style="display: none;" class="mt-3 space-y-3">
            `;

            data.forEach((item, index) => {
                // Tronquer la valeur si elle est trop longue
                const displayValue = item.value.length > 100 ? 
                item.value.substring(0, 100) + '...' : 
                item.value;

                // Déterminer le type de données
                let dataType = 'Personnalisé';
                let typeColor = 'text-gray-400';
                
                // Analyse spécifique pour les données de l'application
                if (item.name === 'history') {
                dataType = 'Historique';
                typeColor = 'text-blue-400';
                } else if (item.name === 'filesystem') {
                dataType = 'Système de fichiers';
                typeColor = 'text-green-400';
                } else if (item.name.includes('theme') || item.name.includes('font') || item.name.includes('bg')) {
                dataType = 'Préférences';
                typeColor = 'text-purple-400';
                } else if (item.name === 'pseudo') {
                dataType = 'Utilisateur';
                typeColor = 'text-yellow-400';
                } else if (item.name.toLowerCase().includes('session')) {
                dataType = 'Session';
                typeColor = 'text-blue-400';
                } else if (item.name.toLowerCase().includes('auth') || item.name.toLowerCase().includes('login')) {
                dataType = 'Authentification';
                typeColor = 'text-red-400';
                }

                // Essayer de parser le JSON pour afficher des infos supplémentaires
                let additionalInfo = '';
                try {
                const parsed = JSON.parse(item.value);
                if (Array.isArray(parsed)) {
                    additionalInfo = `<div class="text-xs text-gray-500 mt-1">Array avec ${parsed.length} éléments</div>`;
                } else if (typeof parsed === 'object') {
                    const keys = Object.keys(parsed);
                    additionalInfo = `<div class="text-xs text-gray-500 mt-1">Objet avec ${keys.length} propriétés</div>`;
                }
                } catch (e) {
                // Pas du JSON, pas grave
                }

                html += `
                <div class="bg-gray-700/30 rounded-lg p-3 border-l-4 ${
                    typeColor.includes('blue') ? 'border-blue-500' : 
                    typeColor.includes('green') ? 'border-green-500' :
                    typeColor.includes('purple') ? 'border-purple-500' :
                    typeColor.includes('yellow') ? 'border-yellow-500' :
                    typeColor.includes('red') ? 'border-red-500' : 'border-gray-500'
                }">
                    <div class="flex justify-between items-start mb-2">
                    <span class="font-bold text-white text-lg break-all">${item.name}</span>
                    <span class="px-2 py-1 rounded text-xs font-semibold ${typeColor} bg-gray-800 ml-2 flex-shrink-0">${dataType}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Valeur:</span>
                        <span class="text-gray-200 font-mono text-xs max-w-xs truncate">${displayValue || '(vide)'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Taille:</span>
                        <span class="text-gray-200 font-mono">${this.formatBytes(item.size)} (${item.length} caractères)</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Pourcentage:</span>
                        <span class="text-gray-200 font-mono">${((item.size / totalSize) * 100).toFixed(1)}%</span>
                    </div>
                    </div>
                    ${additionalInfo}
                </div>
                `;
            });

            html += `
                </div>
                </div>
            `;

            return html;
            };

            // Détails des données si --all ou par défaut
            if (options.all || (!options.count && !options.size && !options.list)) {
            // Afficher les cookies
            if (cookieCount > 0) {
                this.addOutput(createDropdownSection('Cookies', '🍪', cookieDetails, 'text-green-400', 'cookies'), 'system');
            }
            
            // Afficher localStorage
            if (localStorageCount > 0) {
                this.addOutput(createDropdownSection('localStorage', '💾', localStorageDetails, 'text-purple-400', 'localstorage'), 'system');
            }
            
            // Afficher sessionStorage
            if (sessionStorageCount > 0) {
                this.addOutput(createDropdownSection('sessionStorage', '⚡', sessionStorageDetails, 'text-yellow-400', 'sessionstorage'), 'system');
            }
            }

            // Limites et avertissements
            const warningsHTML = `
            <div class="mt-3 p-3 bg-gray-800/30 border border-gray-600 rounded-lg">
            <div class="text-xs text-gray-400 space-y-1">
            <div><span class="text-yellow-300">•</span> Limites cookies: ~4KB par cookie, ~4MB total par domaine</div>
            <div><span class="text-purple-300">•</span> Limites localStorage: ~5-10MB selon le navigateur</div>
            <div><span class="text-blue-300">•</span> Utilisation actuelle: ${this.formatBytes(totalSize)} / ~10MB (${((totalSize / (10 * 1024 * 1024)) * 100).toFixed(2)}%)</div>
            <div><span class="text-green-300">•</span> Utilisez "cookies -d" pour supprimer toutes les données</div>
            <div><span class="text-red-300">•</span> sessionStorage est supprimé à la fermeture de l'onglet</div>
            </div>
            </div>
            `;
            this.addOutput(warningsHTML, 'system');
        },

        df(args) {
            const options = this.parseOptions(args, {
                'h': 'human-readable',
                'T': 'print-type',
                'a': 'all'
            });

            // Simulation d'informations de système de fichiers
            const filesystems = [
                { filesystem: '/dev/root', type: 'ext4', size: 20971520, used: 8388608, avail: 11534336, usePercent: 41, mountedOn: '/' },
                { filesystem: '/dev/tmpfs', type: 'tmpfs', size: 2097152, used: 0, avail: 2097152, usePercent: 0, mountedOn: '/tmp' },
                { filesystem: '/dev/home', type: 'ext4', size: 104857600, used: 52428800, avail: 47185920, usePercent: 53, mountedOn: '/home' }
            ];

            let header = options['print-type'] ?
                'Filesystem     Type      Size  Used Avail Use% Mounted on' :
                'Filesystem      Size  Used Avail Use% Mounted on';

            this.addOutput(`<span class="font-mono">${header}</span>`);

            filesystems.forEach(fs => {
                let size, used, avail;
                if (options['human-readable']) {
                    size = this.formatBytes(fs.size * 1024);
                    used = this.formatBytes(fs.used * 1024);
                    avail = this.formatBytes(fs.avail * 1024);
                } else {
                    size = fs.size.toString();
                    used = fs.used.toString();
                    avail = fs.avail.toString();
                }

                let line = options['print-type'] ?
                    `${fs.filesystem.padEnd(14)} ${fs.type.padEnd(9)} ${size.padStart(4)} ${used.padStart(4)} ${avail.padStart(5)} ${fs.usePercent.toString().padStart(3)}% ${fs.mountedOn}` :
                    `${fs.filesystem.padEnd(15)} ${size.padStart(4)} ${used.padStart(4)} ${avail.padStart(5)} ${fs.usePercent.toString().padStart(3)}% ${fs.mountedOn}`;

                this.addOutput(`<span class="font-mono">${line}</span>`);
            });
        },

        tree(args) {
            // Enhanced option parsing for tree command
            const parseTreeOptions = (args) => {
            const result = { _: [] };
            let i = 0;

            while (i < args.length) {
                const arg = args[i];

                if (arg === '-a') {
                result.all = true;
                } else if (arg === '-d') {
                result['dirs-only'] = true;
                } else if (arg === '-f') {
                result['full-path'] = true;
                } else if (arg === '-i') {
                result['no-indent'] = true;
                } else if (arg === '-C') {
                result.colorize = true;
                } else if (arg === '-s') {
                result.size = true;
                } else if (arg === '-h') {
                result['human-readable'] = true;
                } else if (arg === '-D') {
                result['date-modified'] = true;
                } else if (arg === '-F') {
                result.classify = true;
                } else if (arg === '--inode') {
                result.inode = true;
                } else if (arg === '--links') {
                result.links = true;
                } else if (arg === '--legacy') {
                result.legacy = true;
                } else if (arg === '--debug') {
                result.debug = true;
                } else if (arg === '--help') {
                result.help = true;
                } else if (arg === '-L' && i + 1 < args.length) {
                result.level = parseInt(args[i + 1]);
                i++; // Skip next argument as it's the level value
                } else if (arg === '-P' && i + 1 < args.length) {
                result.pattern = args[i + 1];
                i++; // Skip next argument as it's the pattern
                } else if (!arg.startsWith('-')) {
                result._.push(arg);
                }
                i++;
            }

            return result;
            };

            const options = parseTreeOptions(args);

            // Help option
            if (options.help) {
                this.addOutput(`
                    <div class="bg-gray-800/50 border border-green-600 rounded-lg p-4 my-2">
                        <div class="text-green-400 font-bold text-lg mb-2">TREE - Arborescence des fichiers</div>
                        <div class="text-gray-300 mb-2">Affiche l'arborescence des fichiers et dossiers.</div>
                        <div class="text-yellow-300 font-bold mb-1">SYNOPSIS:</div>
                        <div class="ml-4 text-green-400 font-mono mb-2">tree [OPTIONS] [CHEMIN]</div>
                        <div class="text-yellow-300 font-bold mb-1">OPTIONS:</div>
                        <div class="ml-4 space-y-1">
                            <div class="text-gray-300">-a         Affiche tous les fichiers (y compris cachés)</div>
                            <div class="text-gray-300">-d         Affiche seulement les répertoires</div>
                            <div class="text-gray-300">-f         Affiche le chemin complet</div>
                            <div class="text-gray-300">-F         Ajoute des indicateurs de type (/, *, @)</div>
                            <div class="text-gray-300">-s         Affiche la taille des fichiers</div>
                            <div class="text-gray-300">-h         Tailles lisibles par l'homme</div>
                            <div class="text-gray-300">-D         Affiche la date de modification</div>
                            <div class="text-gray-300">-L niveau  Limite la profondeur d'affichage</div>
                            <div class="text-gray-300">-P motif   Filtre par motif</div>
                            <div class="text-gray-300">--inode    Affiche les numéros I-Node</div>
                            <div class="text-gray-300">--links    Affiche le nombre de liens durs</div>
                            <div class="text-gray-300">--legacy   Force l'utilisation de l'ancien système</div>
                            <div class="text-gray-300">--debug    Affiche les informations de débogage</div>
                        </div>
                        <div class="text-yellow-300 font-bold mb-1 mt-3">EXEMPLES:</div>
                        <div class="ml-4 space-y-1 font-mono text-green-400">
                            <div>tree</div>
                            <div>tree -L 2</div>
                            <div>tree -F --inode</div>
                            <div>tree -d /home</div>
                        </div>
                    </div>
                `, 'system');
                return;
            }

            const maxLevel = options.level || 20;
            const targetPath = options._[0] || '.';
            const resolvedPath = this.resolvePath(targetPath);

            let dirCount = 0;
            let fileCount = 0;
            const treeLines = [];

            // Vérifier si le système I-Node est disponible
            const useInodeSystem = !options.legacy && this.inodeAdapter && this.inodeAdapter.inodeFS;

            if (options.debug) {
                this.addOutput(`<span class="text-cyan-400">🔍 Debug: Système I-Node ${useInodeSystem ? 'DISPONIBLE' : 'NON DISPONIBLE'}</span>`);
                this.addOutput(`<span class="text-cyan-400">🔍 Debug: Chemin cible: ${resolvedPath}</span>`);
                if (options.legacy) {
                    this.addOutput(`<span class="text-cyan-400">🔍 Debug: Mode legacy forcé</span>`);
                }
            }

            // Fonction pour obtenir les informations d'un nœud avec le système I-Node
            const getInodeNodeInfo = (path) => {
                try {
                    const inode = this.inodeAdapter.inodeFS.getInodeByPath(path);
                    if (!inode) return null;

                    return {
                        type: inode.type,
                        content: inode.type === 'file' ? inode.data : null,
                        inodeId: inode.id,
                        linkCount: inode.linkCount,
                        created: inode.created,
                        modified: inode.modified,
                        accessed: inode.accessed,
                        size: inode.type === 'file' ? inode.data.length : 0
                    };
                } catch (error) {
                    return null;
                }
            };

            // Fonction pour lister les enfants d'un répertoire avec le système I-Node
            const getInodeChildren = (path) => {
                try {
                    const inode = this.inodeAdapter.inodeFS.getInodeByPath(path);
                    if (!inode || inode.type !== 'directory') return {};

                    const children = {};
                    const dirEntries = this.inodeAdapter.inodeFS.directories.get(inode.id);
                    
                    if (dirEntries) {
                        for (const [name, childInodeId] of dirEntries.entries()) {
                            if (name !== '.' && name !== '..') {
                                const childInode = this.inodeAdapter.inodeFS.inodes.get(childInodeId);
                                if (childInode) {
                                    children[name] = {
                                        type: childInode.type,
                                        content: childInode.type === 'file' ? childInode.data : null,
                                        inodeId: childInode.id,
                                        linkCount: childInode.linkCount,
                                        created: childInode.created,
                                        modified: childInode.modified,
                                        accessed: childInode.accessed,
                                        size: childInode.type === 'file' ? childInode.data.length : 0
                                    };
                                }
                            }
                        }
                    }
                    return children;
                } catch (error) {
                    return {};
                }
            };

            // Fonction pour obtenir les informations d'un fichier/dossier
            const getFileInfo = (node, name, currentPath) => {
                let info = '';

                if (options.inode && node.inodeId) {
                    info += ` <span class="text-cyan-400">[${node.inodeId}]</span>`;
                }

                if (options.links && node.linkCount) {
                    info += ` <span class="text-orange-400">(${node.linkCount})</span>`;
                }

                if (node.type === 'file') {
                    fileCount++;
                    
                    if (options.size) {
                        const size = node.size || 0;
                        const sizeStr = options['human-readable'] ? 
                            this.formatBytes(size) : 
                            size.toString();
                        info += ` <span class="text-gray-400">[${sizeStr}]</span>`;
                    }
                } else if (node.type === 'directory') {
                    dirCount++;
                }

                if (options['date-modified'] && node.modified) {
                    info += ` <span class="text-yellow-400">${node.modified.toLocaleDateString()}</span>`;
                }

                return { info };
            };

            // Fonction pour formater le nom avec couleurs et classificateurs
            const formatName = (name, node, currentPath) => {
                let displayName = name;
                let color = 'text-white';

                if (node.type === 'directory') {
                    color = 'text-blue-400';
                    if (options.classify) displayName += '/';
                } else if (node.type === 'file') {
                    // Couleur basée sur l'extension
                    const ext = name.split('.').pop().toLowerCase();
                    switch (ext) {
                    case 'txt':
                    case 'md':
                    case 'readme':
                        color = 'text-gray-300';
                        break;
                    case 'js':
                    case 'json':
                    case 'html':
                    case 'css':
                        color = 'text-green-400';
                        if (options.classify) displayName += '*';
                        break;
                    case 'exe':
                    case 'bin':
                        color = 'text-red-400';
                        if (options.classify) displayName += '*';
                        break;
                    case 'zip':
                    case 'tar':
                    case 'gz':
                        color = 'text-purple-400';
                        break;
                    default:
                        color = 'text-gray-300';
                    }

                    // Marquer les liens multiples
                    if (node.linkCount && node.linkCount > 1) {
                        if (options.classify) displayName += '@';
                    }
                }

                // Appliquer le filtre de motif si spécifié
                if (options.pattern) {
                    const regex = new RegExp(options.pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
                    if (!regex.test(name)) {
                        return null;
                    }
                }

                const finalPath = options['full-path'] ? currentPath : displayName;
                return `<span class="${color}">${finalPath}</span>`;
            };

            // Fonction de construction de l'arbre améliorée pour I-Node
            const buildInodeTree = (currentPath, prefix = '', level = 0, isLast = true) => {
                if (level >= maxLevel) return;

                const children = getInodeChildren(currentPath);
                const childNames = Object.keys(children).sort((a, b) => {
                    const aNode = children[a];
                    const bNode = children[b];
                    
                    // Répertoires d'abord, puis fichiers
                    if (aNode.type === 'directory' && bNode.type === 'file') return -1;
                    if (aNode.type === 'file' && bNode.type === 'directory') return 1;
                    return a.localeCompare(b);
                });

                if (options.debug && level < 3) {
                    this.addOutput(`<span class="text-yellow-400">🔍 Debug niveau ${level}: ${childNames.length} enfants dans ${currentPath}</span>`);
                    this.addOutput(`<span class="text-yellow-400">🔍 Debug préfixe: "${prefix}"</span>`);
                }

                let filteredChildren = childNames;

                // Appliquer les filtres
                if (!options.all) {
                    filteredChildren = filteredChildren.filter(name => !name.startsWith('.'));
                }

                if (options['dirs-only']) {
                    filteredChildren = filteredChildren.filter(name => 
                        children[name].type === 'directory'
                    );
                }

                filteredChildren.forEach((childName, index) => {
                    const child = children[childName];
                    const isLastChild = index === filteredChildren.length - 1;
                    const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;

                    // Formater la ligne de l'arbre avec indentation correcte
                    let line;
                    if (options['no-indent']) {
                        line = '';
                    } else {
                        const connector = isLastChild ? '└── ' : '├── ';
                        line = prefix + connector;
                    }

                    const formattedName = formatName(childName, child, childPath);
                    if (formattedName === null) return; // Ignoré par le filtre

                    const { info } = getFileInfo(child, childName, childPath);
                    
                    const fullLine = `<span class="font-mono">${line}${formattedName}${info}</span>`;
                    treeLines.push(fullLine);

                    // Récursion dans les sous-répertoires avec préfixe correct
                    if (child.type === 'directory' && level < maxLevel - 1) {
                        // Le préfixe pour les enfants : espaces insécables pour l'alignement visible
                        const nextPrefix = options['no-indent'] ? '' : 
                            prefix + (isLastChild ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' : '│&nbsp;&nbsp;&nbsp;&nbsp;');  // Espaces insécables visibles
                        buildInodeTree(childPath, nextPrefix, level + 1, isLastChild);
                    }
                });
            };

            // Fonction de construction de l'arbre pour l'ancien système
            const buildLegacyTree = (node, currentPath, prefix = '', level = 0, isLast = true) => {
                if (level >= maxLevel) return;

                const nodeType = node && node.type ? node.type : (node && node.children ? 'directory' : 'file');
                
                if (nodeType === 'directory' && node.children) {
                    const children = Object.keys(node.children).sort((a, b) => {
                        const aNode = node.children[a];
                        const bNode = node.children[b];
                        
                        const aType = aNode && aNode.type ? aNode.type : (aNode && aNode.children ? 'directory' : 'file');
                        const bType = bNode && bNode.type ? bNode.type : (bNode && bNode.children ? 'directory' : 'file');
                        
                        if (aType === 'directory' && bType === 'file') return -1;
                        if (aType === 'file' && bType === 'directory') return 1;
                        return a.localeCompare(b);
                    });

                    let filteredChildren = children;

                    if (!options.all) {
                        filteredChildren = filteredChildren.filter(name => !name.startsWith('.'));
                    }

                    if (options['dirs-only']) {
                        filteredChildren = filteredChildren.filter(name => {
                            const child = node.children[name];
                            const childType = child && child.type ? child.type : (child && child.children ? 'directory' : 'file');
                            return childType === 'directory';
                        });
                    }

                    filteredChildren.forEach((childName, index) => {
                        const child = node.children[childName];
                        const isLastChild = index === filteredChildren.length - 1;
                        const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;

                        // Formater la ligne avec indentation correcte
                        let line;
                        if (options['no-indent']) {
                            line = '';
                        } else {
                            const connector = isLastChild ? '└── ' : '├── ';
                            line = prefix + connector;
                        }

                        // Adapter le nœud pour la compatibilité
                        const adaptedChild = {
                            type: child && child.type ? child.type : (child && child.children ? 'directory' : 'file'),
                            content: child.content || '',
                            size: child.content ? child.content.length : 0,
                            inodeId: null,
                            linkCount: 1,
                            modified: new Date()
                        };

                        const formattedName = formatName(childName, adaptedChild, childPath);
                        if (formattedName === null) return;

                        const { info } = getFileInfo(adaptedChild, childName, childPath);
                        
                        const fullLine = `<span class="font-mono">${line}${formattedName}${info}</span>`;
                        treeLines.push(fullLine);

                        // Récursion avec préfixe correct
                        const childType = adaptedChild.type;
                        if (childType === 'directory' && level < maxLevel - 1 && child.children) {
                            const nextPrefix = options['no-indent'] ? '' : 
                                prefix + (isLastChild ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' : '│&nbsp;&nbsp;&nbsp;&nbsp;');  // Espaces insécables visibles
                            buildLegacyTree(child, childPath, nextPrefix, level + 1, isLastChild);
                        }
                    });
                }
            };

            // Vérifier si le chemin cible existe
            let targetNode = null;
            let rootDisplayPath = resolvedPath;

            if (useInodeSystem) {
                targetNode = getInodeNodeInfo(resolvedPath);
                if (!targetNode) {
                    this.addOutput(`tree: ${targetPath}: Aucun fichier ou dossier de ce type`, 'error');
                    return;
                }

                if (targetNode.type !== 'directory') {
                    this.addOutput(`tree: ${targetPath}: N'est pas un répertoire`, 'error');
                    return;
                }

                // Afficher le répertoire racine
                const rootFormatted = formatName(targetPath === '.' ? '.' : targetPath.split('/').pop() || '/', targetNode, resolvedPath);
                if (rootFormatted) {
                    const { info } = getFileInfo(targetNode, targetPath, resolvedPath);
                    treeLines.push(`<span class="font-mono text-white font-bold">${rootFormatted}${info}</span>`);
                }

                // Construire l'arbre avec I-Node
                buildInodeTree(resolvedPath);
            } else {
                // Utiliser l'ancien système
                targetNode = this.getPath(resolvedPath);
                if (!targetNode) {
                    this.addOutput(`tree: ${targetPath}: Aucun fichier ou dossier de ce type`, 'error');
                    return;
                }

                if (targetNode.type !== 'directory') {
                    this.addOutput(`tree: ${targetPath}: N'est pas un répertoire`, 'error');
                    return;
                }

                // Afficher le répertoire racine
                const adaptedRoot = {
                    type: 'directory',
                    content: '',
                    size: 0,
                    inodeId: null,
                    linkCount: 1,
                    modified: new Date()
                };
                const rootFormatted = formatName(targetPath === '.' ? '.' : targetPath.split('/').pop() || '/', adaptedRoot, resolvedPath);
                if (rootFormatted) {
                    const { info } = getFileInfo(adaptedRoot, targetPath, resolvedPath);
                    treeLines.push(`<span class="font-mono text-white font-bold">${rootFormatted}${info}</span>`);
                }

                // Construire l'arbre avec l'ancien système
                buildLegacyTree(targetNode, resolvedPath);
            }
            
            if (treeLines.length <= 1) {
                this.addOutput('<span class="text-gray-400 italic">Répertoire vide ou aucun fichier correspondant au filtre</span>');
            } else {
                treeLines.forEach(line => this.addOutput(line));
            }

            // Statistiques améliorées
            const statsHTML = `
                <div class="border border-gray-600 rounded-lg p-3 bg-gray-800/30 mt-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <span class="text-blue-400 mr-1">📁</span>
                                <span class="text-blue-300 font-medium">${dirCount} répertoire${dirCount > 1 ? 's' : ''}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-400 mr-1">📄</span>
                                <span class="text-gray-300 font-medium">${fileCount} fichier${fileCount > 1 ? 's' : ''}</span>
                            </div>
                            ${useInodeSystem ? `
                                <div class="flex items-center">
                                    <span class="text-cyan-400 mr-1">🔗</span>
                                    <span class="text-cyan-300 font-medium text-sm">I-Node</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="text-xs text-gray-500">
                            ${maxLevel < 20 ? `Limité à ${maxLevel} niveau${maxLevel > 1 ? 'x' : ''}` : 'Profondeur complète'}
                        </div>
                    </div>
                    ${options.pattern ? `<div class="text-xs text-yellow-400 mt-2">Filtré par motif: "${options.pattern}"</div>` : ''}
                    ${options.inode ? `<div class="text-xs text-cyan-400 mt-1">Numéros I-Node affichés</div>` : ''}
                    ${options.links ? `<div class="text-xs text-orange-400 mt-1">Compteur de liens affichés</div>` : ''}
                </div>
            `;
            this.addOutput(statsHTML, 'system');
        },

        find(args) {
            const options = this.parseOptions(args, {
            'name': 'name',
            'type': 'type',
            'maxdepth': 'maxdepth'
            });

            const startPath = options._.find(arg => !arg.startsWith('-') && !arg.match(/^(f|d)$/)) || '.';
            const resolvedPath = this.resolvePath(startPath);
            const startNode = this.getPath(resolvedPath);

            if (!startNode) {
            this.addOutput(`find: '${startPath}': Aucun fichier ou dossier de ce type`, 'error');
            return;
            }

            const namePattern = options.name;
            const typeFilter = options.type;
            const maxDepth = options.maxdepth ? parseInt(options.maxdepth) : 50;

            const results = [];
            const search = (node, currentPath, depth = 0) => {
            if (depth > maxDepth) return;

            // Vérifie si le nœud correspond aux critères
            let matches = true;
            if (typeFilter) {
                matches = matches && ((typeFilter === 'f' && node.type === 'file') ||
                (typeFilter === 'd' && node.type === 'directory'));
            }
            if (namePattern) {
                const fileName = currentPath.split('/').pop();
                const regex = new RegExp(namePattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
                matches = matches && regex.test(fileName);
            }

            if (matches) {
                results.push(currentPath);
            }

            // Recherche récursive dans TOUS les répertoires enfants
            if (node.type === 'directory' && node.children) {
                Object.keys(node.children).forEach(childName => {
                const childPath = currentPath === '/' ? `/${childName}` : `${currentPath}/${childName}`;
                const childNode = node.children[childName];
                
                // Continuer la recherche récursivement pour chaque enfant
                search(childNode, childPath, depth + 1);
                });
            }
            };

            // Commencer la recherche depuis le nœud de départ
            search(startNode, resolvedPath);
            
            // Afficher tous les résultats trouvés
            if (results.length === 0) {
            this.addOutput(`find: aucun fichier trouvé correspondant aux critères`);
            } else {
            results.forEach(result => this.addOutput(result));
            }
        },

        grep(args) {
            const options = this.parseOptions(args, {
                'i': 'ignore-case',
                'n': 'line-number',
                'v': 'invert-match',
                'c': 'count'
            });

            if (options._.length < 2) {
                this.addOutput('grep: utilisation: grep [options] pattern fichier', 'error');
                return;
            }

            const pattern = options._[0];
            const fileName = options._[1];
            const targetPath = this.resolvePath(fileName);
            const targetNode = this.getPath(targetPath);


            if (!targetNode) {
                this.addOutput(`grep: ${fileName}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            if (targetNode.type !== 'file') {
                this.addOutput(`grep: ${fileName}: N'est pas un fichier`, 'error');
                return;
            }

            const content = targetNode.content;
            const lines = content.split('\n');
            const flags = options['ignore-case'] ? 'gi' : 'g';
            const regex = new RegExp(pattern, flags);

            let matchingLines = [];
            lines.forEach((line, index) => {
                const matches = regex.test(line);
                if (options['invert-match'] ? !matches : matches) {
                    matchingLines.push({
                        number: index + 1,
                        content: line,
                        highlighted: line.replace(new RegExp(pattern, flags), `<span class="bg-yellow-400 text-black">$&</span>`)
                    });
                }
            });

            if (options.count) {
                this.addOutput(matchingLines.length.toString());
            } else {
                matchingLines.forEach(line => {
                    const output = options['line-number'] ?
                        `<span class="text-green-400">${line.number}:</span>${line.highlighted}` :
                        line.highlighted;
                    this.addOutput(output);
                });
            }
        },

        wc(args) {
            const options = this.parseOptions(args, {
                'l': 'lines',
                'w': 'words',
                'c': 'bytes',
                'm': 'chars'
            });

            if (options._.length === 0) {
                this.addOutput('wc: manque un nom de fichier', 'error');
                return;
            }

            const fileName = options._[0];
            const targetPath = this.resolvePath(fileName);
            const targetNode = this.getPath(targetPath);

            if (!targetNode) {
                this.addOutput(`wc: ${fileName}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            if (targetNode.type !== 'file') {
                this.addOutput(`wc: ${fileName}: Est un dossier`, 'error');
                return;
            }

            const content = targetNode.content;
            const lines = content.split('\n').length;
            const words = content.split(/\s+/).filter(w => w.length > 0).length;
            const bytes = new Blob([content]).size;
            const chars = content.length;

            let output = [];

            if (!options.lines && !options.words && !options.bytes && !options.chars) {
                // Par défaut, affiche tout
                output = [lines.toString().padStart(7), words.toString().padStart(7), bytes.toString().padStart(7)];
            } else {
                if (options.lines) output.push(lines.toString().padStart(7));
                if (options.words) output.push(words.toString().padStart(7));
                if (options.bytes) output.push(bytes.toString().padStart(7));
                if (options.chars) output.push(chars.toString().padStart(7));
            }

            this.addOutput(`<span class="font-mono">${output.join('')} ${fileName}</span>`);
        },

        ps(args) {
            const options = this.parseOptions(args, {
                'a': 'all',
                'u': 'user',
                'x': 'no-tty',
                'f': 'full'
            });

            // Simulation de processus
            const processes = [
                { pid: 1, ppid: 0, user: 'root', cpu: 0.0, mem: 0.1, vsz: 168, rss: 8, tty: '?', stat: 'S', start: '00:00', time: '00:00:01', command: '/sbin/init' },
                { pid: 2, ppid: 0, user: 'root', cpu: 0.0, mem: 0.0, vsz: 0, rss: 0, tty: '?', stat: 'S', start: '00:00', time: '00:00:00', command: '[kthreadd]' },
                { pid: 1234, ppid: 1, user: this.getPseudoFromCookie() || 'user', cpu: 1.2, mem: 2.5, vsz: 4096, rss: 256, tty: 'pts/0', stat: 'S', start: '09:30', time: '00:00:15', command: '/bin/bash' },
                { pid: 5678, ppid: 1234, user: this.getPseudoFromCookie() || 'user', cpu: 0.5, mem: 1.0, vsz: 2048, rss: 128, tty: 'pts/0', stat: 'R+', start: '10:45', time: '00:00:02', command: 'webconsole' }
            ];

            if (options.full) {
                this.addOutput(`<span class="font-mono">UID        PID  PPID  C STIME TTY          TIME CMD</span>`);
                processes.forEach(proc => {
                    this.addOutput(`<span class="font-mono">${proc.user.padEnd(8)} ${proc.pid.toString().padStart(5)} ${proc.ppid.toString().padStart(5)} ${proc.cpu.toFixed(1).padStart(3)} ${proc.start.padStart(5)} ${proc.tty.padEnd(12)} ${proc.time.padStart(8)} ${proc.command}</span>`);
                });
            } else if (options.user) {
                this.addOutput(`<span class="font-mono">USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND</span>`);
                processes.forEach(proc => {

                    this.addOutput(`<span class="font-mono">${proc.user.padEnd(8)} ${proc.pid.toString().padStart(5)} ${proc.cpu.toFixed(1).padStart(4)} ${proc.mem.toFixed(1).padStart(4)} ${proc.vsz.toString().padStart(6)} ${proc.rss.toString().padStart(5)} ${proc.tty.padEnd(8)} ${proc.stat.padEnd(4)} ${proc.start.padStart(5)} ${proc.time.padStart(7)} ${proc.command}</span>`);
                });
            } else {
                this.addOutput(`<span class="font-mono">  PID TTY          TIME CMD</span>`);
                processes.filter(proc => proc.tty !== '?').forEach(proc => {
                    this.addOutput(`<span class="font-mono">${proc.pid.toString().padStart(5)} ${proc.tty.padEnd(12)} ${proc.time.padStart(8)} ${proc.command}</span>`);
                });
            }
        },

        top(args) {
            this.addOutput(`<span class="text-green-400">top - ${new Date().toLocaleTimeString()} up 1 day, 2:30, 1 user, load average: 0.15, 0.10, 0.05</span>`);
            this.addOutput(`Tasks: 4 total, 1 running, 3 sleeping, 0 stopped, 0 zombie`);
            this.addOutput(`%Cpu(s): 2.5 us, 1.2 sy, 0.0 ni, 96.0 id, 0.3 wa, 0.0 hi, 0.0 si, 0.0 st`);
            this.addOutput(`MiB Mem: ${(navigator.deviceMemory || 8) * 1024} total, ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.3)} free, ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.7)} used, ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.2)} buff/cache`);
            this.addOutput(`MiB Swap: 0 total, 0 free, 0 used. ${Math.floor((navigator.deviceMemory || 8) * 1024 * 0.8)} avail Mem\n`);

            this.addOutput(`<span class="font-mono">  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND</span>`);
            this.addOutput(`<span class="font-mono"> 1234 ${(this.getPseudoFromCookie() || 'user').padEnd(8)} 20   0    4096    256      0 S   1.2   2.5   0:00.15 bash</span>`);
            this.addOutput(`<span class="font-mono"> 5678 ${(this.getPseudoFromCookie() || 'user').padEnd(8)} 20   0    2048    128      0 R   0.5   1.0   0:00.02 webconsole</span>`);
            this.addOutput(`<span class="font-mono">    1 root      20   0     168      8      0 S   0.0   0.1   0:00.01 init</span>`);
            this.addOutput(`<span class="font-mono">    2 root      20   0       0      0      0 S   0.0   0.0   0:00.00 kthreadd</span>`);

            this.addOutput(`\n<span class="text-yellow-400">Note: Appuyez sur 'q' pour quitter top (simulation)</span>`);
        },

        date(args) {
            const options = this.parseOptions(args, {
                'u': 'utc',
                'R': 'rfc-2822',
                'I': 'iso-8601'
            });

            const now = new Date();

            if (options.utc) {
                this.addOutput(now.toUTCString());
            } else if (options['rfc-2822']) {
                this.addOutput(now.toUTCString());
            } else if (options['iso-8601']) {
                this.addOutput(now.toISOString());
            } else if (options._.length > 0 && options._[0].startsWith('+')) {
                // Format personnalisé (simplifié)
                const format = options._[0].substring(1);
                let result = format
                    .replace(/%Y/g, now.getFullYear())
                    .replace(/%m/g, String(now.getMonth() + 1).padStart(2, '0'))
                    .replace(/%d/g, String(now.getDate()).padStart(2, '0'))
                    .replace(/%H/g, String(now.getHours()).padStart(2, '0'))
                    .replace(/%M/g, String(now.getMinutes()).padStart(2, '0'))
                    .replace(/%S/g, String(now.getSeconds()).padStart(2, '0'));
                this.addOutput(result);
            } else {
                this.addOutput(now.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));
            }
        },

        sudo(args) {
            this.enDev("sudo")
            this.addOutput('sudo: Cette commande est en développement et n\'est pas encore implémentée complètement.', 'error');
        },
        man: function (args) {
            const command = args && args[0] ? args[0].toLowerCase() : '';

            if (!command) {
                // Affiche la liste des manuels disponibles (filtrée)
                this.addOutput(`<div class="text-blue-300 font-bold mb-2">MANUELS DISPONIBLES</div>`);
                this.addOutput(`<div class="text-gray-300 mb-2">Utilisez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ">man [commande]</span>' pour afficher le manuel d'une commande spécifique.</div>`);
                this.addOutput(`<div class="text-yellow-300 mb-2">Commandes disponibles :</div>`);

                // Collecter les commandes natives activées
                const nativeCommands = Object.keys(COMMAND_METADATA).filter(cmd => this.isCommandEnabled(cmd));
                
                // Collecter les commandes des plugins activés
                const pluginCommands = [];
                if (this.pluginManager) {
                    const allPluginCommands = this.pluginManager.getAllCommands();
                    allPluginCommands.forEach(cmd => {
                        if (this.isCommandEnabled(cmd.name)) {
                            pluginCommands.push(cmd.name);
                        }
                    });
                }
                
                // Combiner et trier toutes les commandes
                const allCommands = [...nativeCommands, ...pluginCommands].sort();
                
                let output = '<div class="grid grid-cols-4 gap-4 text-sm">';

                for (let i = 0; i < allCommands.length; i++) {
                    output += `<div class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man ${allCommands[i]}">${allCommands[i]}</div>`;
                }
                output += '</div>';

                this.addOutput(output);
                this.setupClickableCommands();
                return;
            }

            // Vérifier si la commande est activée
            if (!this.isCommandEnabled(command)) {
                this.addOutput(`<div class="text-red-400">man: Aucune entrée de manuel pour '${command}' (commande désactivée)</div>`);
                this.addOutput(`<div class="text-gray-400 text-sm">Utilisez le menu Aide → Commandes pour réactiver cette commande.</div>`);
                return;
            }

            // Chercher d'abord dans les métadonnées des commandes natives
            let metadata = COMMAND_METADATA[command];
            let isPluginCommand = false;
            let pluginCommand = null;
            
            // Si pas trouvé dans les commandes natives, chercher dans les plugins
            if (!metadata && this.pluginManager) {
                pluginCommand = this.pluginManager.getCommand(command);
                if (pluginCommand) {
                    isPluginCommand = true;
                    // Créer des métadonnées compatibles à partir de la commande du plugin
                    metadata = {
                        description: pluginCommand.description || 'Commande de plugin',
                        synopsis: pluginCommand.name + (pluginCommand.usage ? ' ' + pluginCommand.usage : ''),
                        category: pluginCommand.category || 'Plugin',
                        options: pluginCommand.options || [],
                        examples: pluginCommand.examples || [],
                        seeAlso: pluginCommand.seeAlso || []
                    };
                }
            }
            
            if (!metadata) {
                this.addOutput(`<div class="text-red-400">man: aucune entrée de manuel pour ${command}</div>`);
                this.addOutput(`<div class="text-gray-300">Essayez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man">man</span>' pour voir toutes les commandes disponibles.</div>`);
                this.setupClickableCommands();
                return;
            }

            // Affiche le manuel de la commande
            let output = `
                <div class="man-page">
                    <div class="text-blue-300 font-bold text-lg mb-2">${command.toUpperCase()}(1)${isPluginCommand ? ' [PLUGIN]' : ''}</div>
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">NOM</div>
                        <div class="ml-4 text-gray-300">${command} - ${metadata.description}</div>
                    </div>
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">SYNOPSIS</div>
                        <div class="ml-4 text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command" data-command="${metadata.synopsis.split('[')[0].trim()}">${metadata.synopsis}</div>
                    </div>
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">DESCRIPTION</div>
                        <div class="ml-4 text-gray-300">${metadata.description}</div>
                    </div>
            `;

            if (isPluginCommand && pluginCommand.plugin) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">PLUGIN</div>
                        <div class="ml-4 text-gray-300">Cette commande provient du plugin: <span class="text-blue-400">${pluginCommand.plugin}</span></div>
                    </div>
                `;
            }

            if (metadata.options && metadata.options.length > 0) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">OPTIONS</div>
                        <div class="ml-4">
                `;

                metadata.options.forEach(option => {
                    output += `<div class="text-gray-300 mb-1">${option}</div>`;
                });

                output += `
                        </div>
                    </div>
                `;
            }

            if (metadata.examples && metadata.examples.length > 0) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">EXEMPLES</div>
                        <div class="ml-4">
                `;

                metadata.examples.forEach(example => {
                    output += `<div class="text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command mb-1" data-command="${example}">${example}</div>`;
                });

                output += `
                        </div>
                    </div>
                `;
            }

            if (metadata.seeAlso && metadata.seeAlso.length > 0) {
                output += `
                    <div class="mb-4">
                        <div class="text-yellow-300 font-bold mb-1">VOIR AUSSI</div>
                        <div class="ml-4">
                `;

                metadata.seeAlso.forEach(relatedCmd => {
                    output += `<span class="text-green-400 font-mono cursor-pointer hover:text-green-300 clickable-command mr-3" data-command="${relatedCmd}">${relatedCmd}</span>`;
                });

                output += `
                        </div>
                    </div>
                `;
            }

            output += `
                <div class="mt-4 text-xs text-gray-500">
                    WebConsole Manual - Tapez '<span class="text-green-400 cursor-pointer hover:text-green-300 clickable-command" data-command="man">man</span>' pour voir tous les manuels disponibles
                </div>
            </div>
            `;

            this.addOutput(output);
            this.setupClickableCommands();
        },

        // Ajouter ces commandes dans l'objet commands:

        cp(args) {
            if (args.length < 2) {
                this.addOutput('cp: utilisation: cp [options] <source> <dest>', 'error');
                return;
            }

            const options = this.parseOptions(args, { 'r': 'recursive' });
            const source = options._[0];
            const dest = options._[1];

            if (!source || !dest) {
                this.addOutput('cp: source et destination requises', 'error');
                return;
            }

            const sourcePath = this.resolvePath(source);
            const sourceNode = this.getPath(sourcePath);

            if (!sourceNode) {
                this.addOutput(`cp: ${source}: Aucun fichier ou dossier de ce type`, 'error');
                return;
            }

            const destPath = this.resolvePath(dest);
            const destParent = this.getPath(destPath.substring(0, destPath.lastIndexOf('/')) || '/');
            const destName = destPath.split('/').pop();

            if (!destParent || destParent.type !== 'directory') {
                this.addOutput(`cp: ${dest}: Répertoire parent non trouvé`, 'error');
                return;
            }

            // Fonction de copie récursive
            const copyNode = (node) => {
                if (node.type === 'file') {
                    return { type: 'file', content: node.content };
                } else if (node.type === 'directory') {
                    const newDir = { type: 'directory', children: {} };
                    Object.keys(node.children).forEach(childName => {
                        newDir.children[childName] = copyNode(node.children[childName]);
                    });
                    return newDir;
                }
            };

            if (sourceNode.type === 'directory' && !options.recursive) {
                this.addOutput(`cp: ${source}: Est un répertoire (non copié)`, 'error');
                this.addOutput('Utilisez -r pour copier les répertoires', 'error');
                return;
            }

            destParent.children[destName] = copyNode(sourceNode);
            
            // Sauvegarder optimisé
            this.saveFileSystemOptimized();
            this.addOutput(`'${source}' copié vers '${dest}'`);
        },

        mv(args) {
            if (args.length < 2) {
                this.addOutput('mv: utilisation: mv <source> <dest>', 'error');
                return;
            }

            const source = args[0];
            const dest = args[1];
            
            // Vérifier si le système I-Node est disponible
            const useInodeSystem = this.inodeAdapter && this.inodeAdapter.inodeFS;
            
            if (useInodeSystem) {
                // Utiliser le système I-Node
                const sourcePath = this.resolvePath(source);
                const sourceNodeInfo = this.inodeAdapter.getNodeInfo(sourcePath);

                if (!sourceNodeInfo) {
                    this.addOutput(`mv: ${source}: Aucun fichier ou dossier de ce type`, 'error');
                    return;
                }

                const destPath = this.resolvePath(dest);
                
                // Vérifier si la destination est un répertoire existant
                const destNodeInfo = this.inodeAdapter.getNodeInfo(destPath);
                let finalDestPath = destPath;
                
                if (destNodeInfo && destNodeInfo.type === 'directory') {
                    // Si dest est un répertoire, déplacer le fichier dedans
                    const sourceName = sourcePath.split('/').pop();
                    finalDestPath = destPath === '/' ? `/${sourceName}` : `${destPath}/${sourceName}`;
                } else {
                    // Vérifier que le répertoire parent de dest existe
                    const destParentPath = finalDestPath.substring(0, finalDestPath.lastIndexOf('/')) || '/';
                    const destParentInfo = this.inodeAdapter.getNodeInfo(destParentPath);
                    
                    if (!destParentInfo || destParentInfo.type !== 'directory') {
                        this.addOutput(`mv: ${dest}: Répertoire parent non trouvé`, 'error');
                        return;
                    }
                }

                // Effectuer le déplacement avec le système I-Node
                try {
                    const success = this.inodeAdapter.moveNode(sourcePath, finalDestPath);
                    if (success) {
                        // Sauvegarder optimisé
                        this.saveInodeSystemOptimized();
                        this.addOutput(`'${source}' déplacé vers '${dest}'`);
                    } else {
                        this.addOutput(`mv: Erreur lors du déplacement de '${source}' vers '${dest}'`, 'error');
                    }
                } catch (error) {
                    this.addOutput(`mv: Erreur: ${error.message}`, 'error');
                }
            } else {
                // Utiliser l'ancien système de fichiers
                const sourcePath = this.resolvePath(source);
                const sourceNode = this.getPath(sourcePath);

                if (!sourceNode) {
                    this.addOutput(`mv: ${source}: Aucun fichier ou dossier de ce type`, 'error');
                    return;
                }

                // Obtenir le répertoire parent de la source
                const sourceParentPath = sourcePath.substring(0, sourcePath.lastIndexOf('/')) || '/';
                const sourceParent = this.getPath(sourceParentPath);
                const sourceName = sourcePath.split('/').pop();

                const destPath = this.resolvePath(dest);
                let finalDestPath = destPath;
                
                // Vérifier si la destination est un répertoire existant
                const destNode = this.getPath(destPath);
                if (destNode && destNode.type === 'directory') {
                    // Si dest est un répertoire, déplacer le fichier dedans
                    finalDestPath = destPath === '/' ? `/${sourceName}` : `${destPath}/${sourceName}`;
                }

                const destParent = this.getPath(finalDestPath.substring(0, finalDestPath.lastIndexOf('/')) || '/');
                const destName = finalDestPath.split('/').pop();

                if (!destParent || destParent.type !== 'directory') {
                    this.addOutput(`mv: ${dest}: Répertoire parent non trouvé`, 'error');
                    return;
                }

                // Effectuer le déplacement
                destParent.children[destName] = sourceNode;
                delete sourceParent.children[sourceName];

                // Sauvegarder optimisé
                this.saveFileSystemOptimized();
                this.addOutput(`'${source}' déplacé vers '${dest}'`);
            }
        },

        whoami() {
            const pseudo = this.getPseudoFromCookie() || 'user';
            this.addOutput(pseudo);
        },

        uptime() {
            // Simuler un temps de fonctionnement basé sur le temps depuis le chargement de la page
            const now = new Date();
            const loadTime = window.performance.timing.navigationStart;
            const uptimeMs = now.getTime() - loadTime;

            const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

            let uptimeStr = '';
            if (days > 0) uptimeStr += `${days} jour${days > 1 ? 's' : ''}, `;
            if (hours > 0) uptimeStr += `${hours} heure${hours > 1 ? 's' : ''}, `;
            uptimeStr += `${minutes} minute${minutes > 1 ? 's' : ''}`;

            const loadAvg = (Math.random() * 2).toFixed(2);
            this.addOutput(`${now.toLocaleTimeString()} up ${uptimeStr}, 1 utilisateur, charge moyenne: ${loadAvg}`);
        },

        kill(args) {
            if (args.length === 0) {
                this.addOutput('kill: utilisation: kill <pid>', 'error');
                return;
            }

            const pid = parseInt(args[0]);
            if (isNaN(pid)) {
                this.addOutput(`kill: ${args[0]}: arguments incorrects`, 'error');
                return;
            }

            // Simulation - quelques PIDs prédéfinis
            const processes = [1, 2, 1234, 5678];
            if (processes.includes(pid)) {
                if (pid === 1) {
                    this.addOutput('kill: (1) - Operation non permise', 'error');
                } else {
                    this.addOutput(`Processus ${pid} terminé`);
                }
            } else {
                this.addOutput(`kill: (${pid}) - Aucun processus trouvé`, 'error');
            }
        },

        killall(args) {
            if (args.length === 0) {
                this.addOutput('killall: utilisation: killall <nom>', 'error');
                return;
            }

            const processName = args[0];
            const knownProcesses = ['bash', 'webconsole', 'init', 'kthreadd'];

            if (knownProcesses.includes(processName)) {
                if (processName === 'init') {
                    this.addOutput('killall: init: Operation non permise', 'error');
                } else {
                    this.addOutput(`Tous les processus '${processName}' ont été terminés`);
                }
            } else {
                this.addOutput(`killall: ${processName}: aucun processus trouvé`);
            }
        },

        ping(args) {
            if (args.length === 0) {
                this.addOutput('ping: utilisation: ping <adresse>', 'error');
                return;
            }

            const address = args[0];
            this.addOutput(`PING ${address}:`);

            // Fonction pour mesurer la latence avec fetch
            const measureLatency = async (url) => {
                const start = performance.now();
                try {
                    const response = await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });
                    const end = performance.now();
                    return end - start;
                } catch (error) {
                    throw error;
                }
            };

            // Effectuer 4 pings réels
            let pingCount = 0;
            const results = [];
            
            const performPing = async () => {
                pingCount++;
                try {
                    // Essayer différents protocoles/formats d'URL
                    let testUrl = address;
                    if (!address.startsWith('http://') && !address.startsWith('https://')) {
                        testUrl = `https://${address}`;
                    }
                    
                    const latency = await measureLatency(testUrl);
                    results.push(latency);
                    this.addOutput(`64 bytes from ${address}: seq=${pingCount} time=${latency.toFixed(1)}ms`);
                } catch (error) {
                    this.addOutput(`ping: ${address}: Host inaccessible ou erreur réseau`, 'error');
                    results.push(null);
                }

                if (pingCount < 4) {
                    setTimeout(performPing, 1000);
                } else {
                    // Afficher les statistiques
                    const successfulPings = results.filter(r => r !== null);
                    const packetLoss = ((4 - successfulPings.length) / 4 * 100).toFixed(0);
                    
                    this.addOutput(`\n--- ${address} statistiques ping ---`);
                    this.addOutput(`4 paquets transmis, ${successfulPings.length} reçus, ${packetLoss}% perte de paquets`);
                    
                    if (successfulPings.length > 0) {
                        const min = Math.min(...successfulPings).toFixed(1);
                        const max = Math.max(...successfulPings).toFixed(1);
                        const avg = (successfulPings.reduce((a, b) => a + b, 0) / successfulPings.length).toFixed(1);
                        this.addOutput(`round-trip min/avg/max = ${min}/${avg}/${max} ms`);
                    }
                }
            };

            performPing();
        },

        wget(args) {
            this.enDev("wget");
            if (args.length === 0) {
                this.addOutput('wget: utilisation: wget <url>', 'error');
                return;
            }

            const url = args[0];
            this.addOutput(`--${new Date().toISOString()} ${url}`);
            this.addOutput('Résolution de l\'hôte... fait.');
            this.addOutput('Connexion à l\'hôte... connecté.');
            this.addOutput('Requête HTTP envoyée, en attente de la réponse...');

            // Simuler le téléchargement
            setTimeout(() => {
                const fileName = url.split('/').pop() || 'index.html';
                this.addOutput('200 OK');
                this.addOutput(`Sauvegarde en : '${fileName}'`);
                this.addOutput(`100%[===================>] ${Math.floor(Math.random() * 1000)}K en 0,5s`);
                this.addOutput(`'${fileName}' sauvegardé (simulation)`);
            }, 1500);
        },

        curl(args) {
            if (args.length === 0) {
                this.addOutput('curl: utilisation: curl [options] <url>', 'error');
                return;
            }

            const options = this.parseOptions(args, {
                'I': 'head',
                'o': 'output',
                'v': 'verbose'
            });

            const url = options._[0];
            if (!url) {
                this.addOutput('curl: aucune URL spécifiée', 'error');
                return;
            }

            if (options.head) {
                this.addOutput('HTTP/1.1 200 OK');
                this.addOutput('Content-Type: text/html');
                this.addOutput('Content-Length: 1234');
                this.addOutput(`Date: ${new Date().toUTCString()}`);
                this.addOutput('Server: nginx/1.18.0');
            } else {
                this.addOutput(`Simulation de requête GET vers ${url}`);
                this.addOutput('<!DOCTYPE html><html><head><title>Page simulée</title></head>');
                this.addOutput('<body><h1>Contenu simulé</h1><p>Ceci est une simulation de curl.</p></body></html>');
            }
        },

        cowsay(args) {
            const message = args.join(' ') || 'Moo!';
            const messageLength = message.length;
            const topBorder = ' ' + '_'.repeat(messageLength + 2);
            const bottomBorder = ' ' + '-'.repeat(messageLength + 2);

            this.addOutput(`<pre>
${topBorder}
< ${message} >
${bottomBorder}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
</pre>`);
        },

        figlet(args) {
            const text = args.join(' ') || 'HELLO';
            const asciiArt = {
                'A': ['  █████  ', ' ██   ██ ', ' ███████ ', ' ██   ██ ', ' ██   ██ '],
                'B': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██   ██ ', ' ██████  '],
                'C': [' ██████  ', ' ██      ', ' ██      ', ' ██      ', ' ██████  '],
                'D': [' ██████  ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██████  '],
                'E': [' ███████ ', ' ██      ', ' █████   ', ' ██      ', ' ███████ '],
                'F': [' ███████ ', ' ██      ', ' █████   ', ' ██      ', ' ██      '],
                'G': [' ██████  ', ' ██      ', ' ██  ███ ', ' ██   ██ ', ' ██████  '],
                'H': [' ██   ██ ', ' ██   ██ ', ' ███████ ', ' ██   ██ ', ' ██   ██ '],
                'I': [' ██ ', ' ██ ', ' ██ ', ' ██ ', ' ██ '],
                'J': ['      ██ ', '      ██ ', '      ██ ', ' ██   ██ ', ' ██████  '],
                'K': [' ██   ██ ', ' ██  ██  ', ' █████   ', ' ██  ██  ', ' ██   ██ '],
                'L': [' ██      ', ' ██      ', ' ██      ', ' ██      ', ' ███████ '],
                'M': [' ███    ███ ', ' ████  ████ ', ' ██ ████ ██ ', ' ██  ██  ██ ', ' ██      ██ '],
                'N': [' ███    ██ ', ' ████   ██ ', ' ██ ██  ██ ', ' ██  ██ ██ ', ' ██   ████ '],
                'O': [' ███████ ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ███████ '],
                'P': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██      ', ' ██      '],
                'Q': [' ██████  ', ' ██   ██ ', ' ██   ██ ', ' ██  ███ ', ' ███████ '],
                'R': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██   ██ ', ' ██   ██ '],
                'S': [' ███████ ', ' ██      ', ' ███████ ', '      ██ ', ' ███████ '],
                'T': [' ████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
                'U': [' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██████  '],
                'V': [' ██   ██ ', ' ██   ██ ', ' ██   ██ ', '  ██ ██  ', '   ███   '],
                'W': [' ██      ██ ', ' ██  ██  ██ ', ' ██ ████ ██ ', ' ████  ████ ', ' ███    ███ '],
                'X': [' ██   ██ ', '  ██ ██  ', '   ███   ', '  ██ ██  ', ' ██   ██ '],
                'Y': [' ██   ██ ', '  ██ ██  ', '   ███   ', '    ██   ', '    ██   '],
                'Z': [' ███████ ', '     ██  ', '    ██   ', '   ██    ', ' ███████ '],
                ' ': ['    ', '    ', '    ', '    ', '    ']
            };

            const lines = ['', '', '', '', ''];
            for (let char of text.toUpperCase()) {
                const charArt = asciiArt[char] || asciiArt[' '];
                for (let i = 0; i < 5; i++) {
                    lines[i] += charArt[i] + ' ';
                }
            }

            this.addOutput(`<pre class="text-blue-400">${lines.join('\n')}</pre>`);
        },

        fortune() {
            const fortunes = [
                "La programmation, c'est comme un iceberg : 90% du travail est invisible.",
                "Il n'y a que deux choses difficiles en informatique : l'invalidation de cache et nommer les choses.",
                "Un bon programmeur est quelqu'un qui regarde des deux côtés avant de traverser une rue à sens unique.",
                "Le débogage, c'est comme être détective dans un film policier où vous êtes aussi le meurtrier.",
                "Il y a 10 types de personnes : celles qui comprennent le binaire et celles qui ne le comprennent pas.",
                "Les meilleurs codes sont ceux qui n'ont pas besoin de commentaires... mais qui en ont quand même.",
                "La patience est une vertu, surtout quand on attend que le code compile.",
                "Un programme qui fonctionne du premier coup est suspect.",
                "L'expérience, c'est le nom que chacun donne à ses erreurs de programmation.",
                "La première règle de l'optimisation : ne pas optimiser.",
                "Il est plus facile d'optimiser du code correct que de corriger du code optimisé.",
                "Un développeur sans café est comme un ordinateur sans électricité."
            ];

            const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
            this.addOutput(`<span class="text-yellow-300">${randomFortune}</span>`);
        },

        cmatrix() {
            this.addOutput('<span class="text-green-400">Lancement de la simulation Matrix...</span>');
            this.addOutput('<span class="text-yellow-300">Appuyez sur "q" pour quitter</span>');

            // Créer un overlay pour le canvas Matrix en plein écran
            const matrixOverlay = document.createElement('div');
            matrixOverlay.id = 'matrix-overlay';
            matrixOverlay.className = 'fixed inset-0 z-50 bg-black';
            matrixOverlay.innerHTML = `
            <canvas id="matrix-canvas" class="w-full h-full block"></canvas>
                        
            <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/30">
                <div class="text-green-400 text-sm font-mono mb-1">🔴 MATRIX SIMULATION</div>
                <div class="text-green-300 text-xs font-mono opacity-80">Appuyez sur "q" pour quitter</div>
            </div>
            <button id="matrix-fullscreen-btn" class="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 hover:bg-green-500/20 transition-colors duration-200">
                <div class="text-green-400 text-sm font-mono">⛶ Plein écran</div>
            </button>
            `;
            
            // Ajouter l'overlay au body pour qu'il recouvre tout l'écran
            document.body.appendChild(matrixOverlay);

            // Effet Matrix intégré
            const canvas = document.getElementById('matrix-canvas');
            const ctx = canvas.getContext('2d');

            // Caractères Matrix (katakana, hiragana, chiffres)
            const matrixChars = "田由甲申甴电甶男甸甹町画甼甽甾甿畀畁畂畃畄畅畆畇畈畉畊畋界畍畎畏畐畑アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            const fontSize = 16;
            let drops = [];

            // Fonction pour redimensionner le canvas
            const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                
                // Recalculer les colonnes
                const columns = Math.floor(canvas.width / fontSize);
                drops = [];
                for (let x = 0; x < columns; x++) {
                    drops[x] = Math.floor(Math.random() * (canvas.height / fontSize));
                }
            };

            // Initialiser la taille
            resizeCanvas();

            let animationId;
            const draw = () => {
                // Fond noir semi-transparent pour l'effet de traînée
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Style du texte
                ctx.fillStyle = '#0F0'; // Vert Matrix
                ctx.font = fontSize + 'px monospace';

                for (let i = 0; i < drops.length; i++) {
                    // Caractère aléatoire
                    const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                    
                    // Position X et Y
                    const x = i * fontSize;
                    const y = drops[i] * fontSize;

                    ctx.fillText(text, x, y);

                    // Redémarrer la goutte quand elle sort de l'écran
                    if (y > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    
                    // Faire tomber la goutte
                    drops[i]++;
                }

                // Continue the animation loop
                setTimeout(() => {
                    animationId = requestAnimationFrame(draw);
                }, 10); // Délai pour ralentir l'animation
            };

            // Démarrer l'animation
            draw();

            // Bouton plein écran
            const fullscreenBtn = document.getElementById('matrix-fullscreen-btn');
            const handleFullscreenClick = () => {
            if (!document.fullscreenElement) {
                matrixOverlay.requestFullscreen().then(() => {
                resizeCanvas();
                fullscreenBtn.innerHTML = '<div class="text-green-400 text-sm font-mono flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Quitter</div>';
                }).catch(err => {
                console.error('Erreur plein écran:', err);
                });
            } else {
                document.exitFullscreen().then(() => {
                resizeCanvas();
                fullscreenBtn.innerHTML = '<div class="text-green-400 text-sm font-mono">⛶ Plein écran</div>';
                });
            }
            };
            
            fullscreenBtn.addEventListener('click', handleFullscreenClick);

            // Gestionnaire pour les changements de plein écran
            const handleFullscreenChange = () => {
            setTimeout(resizeCanvas, 100); // Petit délai pour s'assurer que les dimensions sont correctes
            };
            document.addEventListener('fullscreenchange', handleFullscreenChange);

            // Gestionnaire d'événements pour quitter avec "q"
            const handleKeyPress = (e) => {
            if (e.key.toLowerCase() === 'q') {
                // Sortir du plein écran si nécessaire
                if (document.fullscreenElement) {
                document.exitFullscreen();
                }
                
                // Arrêter l'animation
                if (animationId) {
                cancelAnimationFrame(animationId);
                }
                
                // Nettoyer l'overlay (supprimer du DOM)
                if (matrixOverlay && matrixOverlay.parentNode) {
                matrixOverlay.parentNode.removeChild(matrixOverlay);
                }
                
                // Retirer les écouteurs d'événements
                document.removeEventListener('keypress', handleKeyPress);
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
                window.removeEventListener('resize', handleResize);
                
                // Nettoyer la console et afficher le message de sortie
                this.addOutput('<span class="text-red-400">Matrix simulation terminée</span>');
                this.commandInputElement.focus();
            }
            };

            // Gestionnaire pour redimensionner le canvas
            const handleResize = () => {
            resizeCanvas();
            };

            document.addEventListener('keypress', handleKeyPress);
            window.addEventListener('resize', handleResize);
        },

        // Générateur de mots de passe
        genpass(args) {
            const options = this.parseOptions(args, {
            'l': 'length',
            'n': 'numbers',
            's': 'symbols',
            'u': 'uppercase',
            'c': 'count',
            'h': 'help'
            });
            
            // Help option
            if (options.help) {
                this.commands.man.call(this, ['genpass']);
                return;
            }
            
            // Rechercher un nombre dans les arguments pour la longueur
            let length = parseInt(options.length) || 12;
            const numberArg = args.find(arg => /^\d+$/.test(arg));
            if (numberArg) {
            length = parseInt(numberArg);
            }
            
            // Nombre de mots de passe à générer
            let count = parseInt(options.count) || 1;
            if (count > 10) count = 10; // Limite pour éviter le spam
            
            // Support des options négatives avec "-"
            const includeNumbers = !args.includes('-n') && options.numbers !== false;
            const includeSymbols = !args.includes('-s') && options.symbols !== false;
            const includeUppercase = !args.includes('-u') && options.uppercase !== false;
            
            // Validation de la longueur
            if (length < 4 || length > 128) {
            this.addOutput('<span class="text-red-400">❌ Erreur: la longueur doit être entre 4 et 128 caractères</span>', 'error');
            return;
            }
            
            let chars = 'abcdefghijklmnopqrstuvwxyz';
            if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (includeNumbers) chars += '0123456789';
            if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.?';
            
            // Génération des mots de passe
            for (let p = 0; p < count; p++) {
            let password = '';
            for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            // Calculer la force du mot de passe
            let strength = 0;
            let strengthText = '';
            let strengthColor = '';
            
            if (password.length >= 8) strength += 20;
            if (password.length >= 12) strength += 10;
            if (/[a-z]/.test(password)) strength += 15;
            if (/[A-Z]/.test(password)) strength += 15;
            if (/[0-9]/.test(password)) strength += 15;
            if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
            
            if (strength < 40) {
            strengthText = 'Faible';
            strengthColor = 'text-red-400';
            } else if (strength < 70) {
            strengthText = 'Moyen';
            strengthColor = 'text-yellow-400';
            } else if (strength < 90) {
            strengthText = 'Fort';
            strengthColor = 'text-green-400';
            } else {
            strengthText = 'Très fort';
            strengthColor = 'text-green-300';
            }
            
            const passwordHTML = `
            <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/50 mt-2">
            <div class="flex items-center justify-between mb-3">
                <span class="font-bold text-blue-400">Mot de passe ${count > 1 ? '#' + (p + 1) : ''}</span>
                <span class="px-2 py-1 rounded text-xs font-semibold ${strengthColor} bg-gray-700">${strengthText}</span>
            </div>
            
            <div class="bg-gray-900 rounded-lg p-3 border border-gray-600 mb-3">
                <div class="flex items-center">
                <span class="font-mono text-lg text-green-300 select-all break-all flex-1 min-w-0 mr-3">${password}</span>
                <button onclick="navigator.clipboard.writeText('${password}').then(() => app.addOutput('🔐 Mot de passe copié!', 'system'))" 
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors duration-200 flex-shrink-0 whitespace-nowrap">
                📋 Copier
                </button>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Longueur</div>
                <div class="text-white font-mono">${password.length}</div>
                </div>
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Force</div>
                <div class="${strengthColor} font-semibold">${strength}/100</div>
                </div>
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Entropie</div>
                <div class="text-white font-mono">${Math.floor(Math.log2(Math.pow(chars.length, length)))} bits</div>
                </div>
                <div class="bg-gray-700/30 rounded p-2 text-center">
                <div class="text-gray-400 mb-1">Charset</div>
                <div class="text-white font-mono">${chars.length}</div>
                </div>
            </div>
            </div>
            `;
            
            this.addOutput(passwordHTML, 'system');
            }
        },



        // Calculatrice
        calc(args) {
            const expression = args.join(' ');
            if (!expression) {
                this.addOutput('calc: utilisation: calc <expression>', 'error');
                return;
            }
            
            try {
                // Remplacer les opérateurs textuels
                let safeExpression = expression
                    .replace(/[^0-9+\-*/().\s]/g, '') // Sécurité basique
                    .replace(/\s+/g, '');
                    
                const result = Function('"use strict"; return (' + safeExpression + ')')();
                this.addOutput(`<span class="text-blue-400">📊 ${expression} = <span class="text-yellow-300 font-mono">${result}</span></span>`);
            } catch (error) {
                this.addOutput('calc: expression invalide', 'error');
            }
        },
        
        reboot() {
            // Notification de début de redémarrage
            this.showNotification({
            type: 'warning',
            title: '🔄 Redémarrage du système',
            message: 'Le système va redémarrer dans quelques secondes...',
            duration: 3000,
            actions: [
                {
                text: '⚡ Redémarrer maintenant',
                callback: () => {
                    window.location.reload();
                }
                }
            ]
            });

            // Notification de progression (après 1 seconde)
            setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: '⚙️ Arrêt des services',
                message: 'Fermeture des processus système en cours...',
                duration: 3000,
                closable: false
            });
            }, 1000);

            // Notification de sauvegarde (après 2.5 secondes)
            setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: '💾 Sauvegarde',
                message: 'Sauvegarde des données utilisateur...',
                duration: 2500,
                closable: false
            });
            }, 2500);

            // Notification de nettoyage (après 4 secondes)
            setTimeout(() => {
            this.showNotification({
                type: 'info',
                title: '🧹 Nettoyage',
                message: 'Nettoyage de la mémoire système...',
                duration: 2000,
                closable: false
            });
            }, 4000);

            // Notification de compte à rebours (après 5.5 secondes)
            setTimeout(() => {
            let countdown = 5;
            const countdownNotificationId = this.showNotification({
                type: 'warning',
                title: `🔄 Redémarrage dans ${countdown} secondes`,
                message: 'Le système va redémarrer automatiquement',
                duration: 0,
                closable: false,
                showProgress: false,
                actions: [
                {
                    text: '⚡ Redémarrer immédiatement',
                    callback: () => {
                    window.location.reload();
                    }
                }
                ]
            });

            // Mise à jour du compte à rebours
            const countdownInterval = setInterval(() => {
                countdown--;
                const notification = document.getElementById(countdownNotificationId);
                if (notification && countdown > 0) {
                const titleElement = notification.querySelector('.font-semibold');
                if (titleElement) {
                    titleElement.textContent = `🔄 Redémarrage dans ${countdown} seconde${countdown > 1 ? 's' : ''}`;
                }
                } else {
                clearInterval(countdownInterval);
                }
            }, 1000);

            // Redémarrage final (après 5 secondes)
            setTimeout(() => {
                clearInterval(countdownInterval);
                this.closeNotification(countdownNotificationId);
                
                this.showNotification({
                type: 'success',
                title: '✨ Redémarrage en cours...',
                message: 'Le système redémarre maintenant',
                duration: 2000,
                closable: false,
                showProgress: true
                });
                
                // Rechargement final
                setTimeout(() => {
                window.location.reload();
                }, 1000);
            }, 5000);
            }, 5500);
        },

        fullscreen() {
            app.fullscreen();
        },

        notify(args) {
            // Vérifier d'abord si --help est présent avant de parser les options
            if (args.includes('--help') || args.includes('-h')) {
            // Utiliser la fonction man pour afficher l'aide de notify
            this.commands.man.call(this, ['notify']);
            return;
            }

            // Parser manuellement les arguments pour gérer correctement les espaces dans les valeurs
            let type = 'info';
            let title = 'Notification';
            let duration = 5000;
            let persistent = false;
            let action = null;
            let messageArgs = [];
            let useDesktop = false; // Nouveau: notifications de bureau
            let useHybrid = false;  // Nouveau: mode hybride (interface + bureau)
            
            // Fonction pour extraire les valeurs entre guillemets ou un seul argument
            const extractQuotedValue = (args, startIndex) => {
            if (startIndex >= args.length) return { value: null, nextIndex: startIndex };
            
            const firstArg = args[startIndex];
            
            // Si l'argument commence par des guillemets
            if (firstArg.startsWith('"')) {
                // Si c'est un argument complet entre guillemets
                if (firstArg.endsWith('"') && firstArg.length > 1) {
                return { 
                    value: firstArg.slice(1, -1), // Enlever les guillemets
                    nextIndex: startIndex + 1 
                };
                }
                
                // Sinon, chercher la fin des guillemets dans les arguments suivants
                let result = firstArg.slice(1); // Enlever le guillemet du début
                let currentIndex = startIndex + 1;
                
                while (currentIndex < args.length) {
                const currentArg = args[currentIndex];
                if (currentArg.endsWith('"')) {
                    result += ' ' + currentArg.slice(0, -1); // Enlever le guillemet de fin
                    return { value: result, nextIndex: currentIndex + 1 };
                } else {
                    result += ' ' + currentArg;
                }
                currentIndex++;
                }
                
                // Si on arrive ici, les guillemets ne sont pas fermés
                return { value: result, nextIndex: currentIndex };
            } else {
                // Pas de guillemets, prendre juste l'argument
                return { value: firstArg, nextIndex: startIndex + 1 };
            }
            };
            
            for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg === '-t' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                type = result.value;
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (arg === '-T' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                title = result.value;
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (arg === '-d' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                const parsedDuration = parseInt(result.value);
                if (!isNaN(parsedDuration) && parsedDuration >= 0) {
                    duration = parsedDuration;
                }
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (arg === '-p') {
                persistent = true;
            } else if (arg === '--desktop' || arg === '-D') {
                useDesktop = true;
            } else if (arg === '--hybrid' || arg === '-H') {
                useHybrid = true;
            } else if (arg === '-a' && i + 1 < args.length) {
                const result = extractQuotedValue(args, i + 1);
                if (result.value !== null) {
                action = result.value;
                i = result.nextIndex - 1; // -1 car la boucle va incrémenter
                } else {
                i++; // Skip si pas de valeur
                }
            } else if (!arg.startsWith('-')) {
                // C'est un argument du message
                messageArgs.push(arg);
            }
            }

            if (messageArgs.length === 0) {
            this.addOutput('notify: manque le message à afficher', 'error');
            this.addOutput('Utilisez "notify --help" pour plus d\'informations.');
            return;
            }

            const message = messageArgs.join(' ');
            
            // Déterminer le type de notification
            const validTypes = ['info', 'success', 'warning', 'error'];
            const notificationType = validTypes.includes(type) ? type : 'info';
            
            // Déterminer la durée finale
            if (persistent) {
            duration = 0; // Permanent
            }
            
            // Préparer les actions
            const actions = [];
            if (action) {
            actions.push({
                text: action,
                callback: () => {
                this.addOutput(`Action "${action}" exécutée`, 'system');
                }
            });
            }

            // Afficher la notification
            this.showNotification({
            type: notificationType,
            title: title,
            message: message,
            duration: duration,
            closable: true,
            actions: actions,
            useDesktopNotification: useDesktop,
            useHybridMode: useHybrid
            });

            // Utiliser la fonction existante createInfoBlock pour créer un bloc d'information structuré
            const notificationInfo = this.createInfoBlock({
            title: 'Configuration de la notification',
            icon: '📱',
            color: 'text-blue-400',
            bgColor: 'bg-blue-900/20',
            borderColor: 'border-blue-500',
            items: [
                { label: 'Type', value: notificationType, labelColor: 'text-blue-300' },
                { label: 'Titre', value: `"${title}"`, labelColor: 'text-purple-300' },
                { label: 'Message', value: `"${message}"`, labelColor: 'text-green-300' },
                { label: 'Durée', value: duration === 0 ? '∞ permanente' : duration + 'ms', labelColor: 'text-yellow-300' },
                { label: 'Persistante', value: persistent ? '✅ oui' : '❌ non', labelColor: 'text-orange-300' },
                { label: 'Action', value: action || '❌ aucune', labelColor: 'text-cyan-300' },
                { label: 'Bureau', value: useDesktop ? '🖥️ oui' : '❌ non', labelColor: 'text-pink-300' },
                { label: 'Hybride', value: useHybrid ? '🔄 oui' : '❌ non', labelColor: 'text-indigo-300' },
            ]
            });

            this.addOutput(notificationInfo, 'system');

            // Confirmer dans la console
            const durationText = duration === 0 ? 'permanente' : `${duration}ms`;
            const modeText = useDesktop ? 'bureau' : useHybrid ? 'hybride' : 'interface';
            this.addOutput(`📱 Notification ${notificationType} affichée en mode ${modeText} (durée: ${durationText})`, 'system');
        },

        // Nouvelle commande pour tester les notifications de bureau
        desktopnotify(args) {
            if (args.includes('--help') || args.includes('-h')) {
                this.addOutput(`
<span class="text-cyan-400 font-bold">🖥️ desktopnotify - Notifications de bureau natives</span>

<span class="text-yellow-400 font-semibold">UTILISATION:</span>
    desktopnotify [OPTIONS] MESSAGE

<span class="text-yellow-400 font-semibold">OPTIONS:</span>
    <span class="text-green-400">-t TYPE</span>      Type de notification (info, success, warning, error)
    <span class="text-green-400">-T TITRE</span>     Titre de la notification (défaut: "CLK Console")
    <span class="text-green-400">-d DURÉE</span>     Durée en millisecondes (défaut: 5000, 0 = permanent)
    <span class="text-green-400">--check</span>      Vérifier le support et les permissions
    <span class="text-green-400">--request</span>    Demander les permissions
    <span class="text-green-400">-h, --help</span>   Afficher cette aide

<span class="text-yellow-400 font-semibold">EXEMPLES:</span>
    <span class="text-slate-400">desktopnotify "Hello World!"</span>
    <span class="text-slate-400">desktopnotify -t success -T "Succès" "Opération terminée"</span>
    <span class="text-slate-400">desktopnotify --check</span>
    <span class="text-slate-400">desktopnotify --request</span>

<span class="text-yellow-400 font-semibold">NOTES:</span>
    • Nécessite les permissions de notification du navigateur
    • Les notifications apparaissent dans la zone de notification du système
    • Utilisez --check pour vérifier la compatibilité
                `, 'system');
                return;
            }

            // Option pour vérifier le support
            if (args.includes('--check')) {
                const isSupported = 'Notification' in window;
                const permission = isSupported ? Notification.permission : 'non-supporté';
                
                this.addOutput(`
<span class="text-blue-400 font-bold">🔍 État des notifications de bureau:</span>

<span class="text-yellow-400">Support navigateur:</span> ${isSupported ? '✅ Supporté' : '❌ Non supporté'}
<span class="text-yellow-400">Permission actuelle:</span> ${permission === 'granted' ? '✅ Accordée' : permission === 'denied' ? '❌ Refusée' : '⚠️ Non demandée'}
<span class="text-yellow-400">État:</span> ${isSupported && permission === 'granted' ? '🟢 Prêt à utiliser' : '🔴 Nécessite une action'}

${!isSupported ? '<span class="text-red-400">⚠️ Votre navigateur ne supporte pas les notifications de bureau</span>' : ''}
${isSupported && permission === 'default' ? '<span class="text-orange-400">💡 Utilisez "desktopnotify --request" pour demander les permissions</span>' : ''}
${isSupported && permission === 'denied' ? '<span class="text-red-400">⚠️ Permissions refusées. Activez-les dans les paramètres du navigateur</span>' : ''}
                `, 'system');
                return;
            }

            // Option pour demander les permissions
            if (args.includes('--request')) {
                if (!('Notification' in window)) {
                    this.addOutput('❌ Les notifications de bureau ne sont pas supportées par ce navigateur', 'error');
                    return;
                }

                if (Notification.permission === 'granted') {
                    this.addOutput('✅ Les permissions sont déjà accordées', 'success');
                    return;
                }

                if (Notification.permission === 'denied') {
                    this.addOutput('❌ Les permissions ont été refusées. Vous devez les activer manuellement dans les paramètres du navigateur', 'error');
                    return;
                }

                this.addOutput('🔄 Demande de permission en cours...', 'info');
                
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.addOutput('✅ Permissions accordées ! Vous pouvez maintenant utiliser les notifications de bureau', 'success');
                        
                        // Notification de test
                        new Notification('CLK Console', {
                            body: 'Notifications de bureau activées avec succès !',
                            icon: '/contents/img/logo.svg'
                        });
                    } else {
                        this.addOutput('❌ Permissions refusées', 'error');
                    }
                });
                
                return;
            }

            // Parser les arguments pour la notification
            let type = 'info';
            let title = 'CLK Console';
            let duration = 5000;
            let messageArgs = [];

            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                
                if (arg === '-t' && i + 1 < args.length) {
                    type = args[i + 1];
                    i++; // Skip next argument
                } else if (arg === '-T' && i + 1 < args.length) {
                    title = args[i + 1];
                    i++; // Skip next argument
                } else if (arg === '-d' && i + 1 < args.length) {
                    const parsedDuration = parseInt(args[i + 1]);
                    if (!isNaN(parsedDuration) && parsedDuration >= 0) {
                        duration = parsedDuration;
                    }
                    i++; // Skip next argument
                } else if (!arg.startsWith('-')) {
                    messageArgs.push(arg);
                }
            }

            if (messageArgs.length === 0) {
                this.addOutput('desktopnotify: manque le message à afficher', 'error');
                this.addOutput('Utilisez "desktopnotify --help" pour plus d\'informations.');
                return;
            }

            const message = messageArgs.join(' ');

            // Utiliser la fonction de notification de bureau
            this.showNotification({
                type: type,
                title: title,
                message: message,
                duration: duration,
                useDesktopNotification: true
            });

            this.addOutput(`🖥️ Notification de bureau envoyée: "${title}" - "${message}"`, 'system');
        },

        checkfile(args) {
            if (!args || args.length === 0) {
                this.addOutput('checkfile: manque un nom de fichier', 'error');
                return;
            }
            
            const fileName = args[0].trim();
            this.checkFileContent(fileName);
        },
        qrcode(args) {
            const options = this.parseOptions(args, {
            's': 'size',
            'c': 'color',
            'b': 'bgcolor',
            'f': 'format',
            'e': 'error-level',
            'h': 'help'
            });

            // Help option
            if (options.help || args.includes('--help')) {
            this.commands.man.call(this, ['qrcode']);
            return;
            }

            // Récupérer le texte à encoder
            const text = options._.join(' ').trim();
            if (!text) {
                this.addOutput('qrcode: manque le texte à encoder', 'error');
                this.addOutput('Utilisation: qrcode [options] <texte>');
                this.addOutput('Exemple: qrcode "https://example.com"');
                return;
            }

            // Configuration par défaut
            const config = {
                size: parseInt(options.size) || 200,
                color: options.color || '000000',
                bgcolor: options.bgcolor || 'ffffff',
                format: options.format || 'png',
                errorLevel: options['error-level'] || 'M',
                text: encodeURIComponent(text)
            };

            // Validation des paramètres
            if (config.size < 50 || config.size > 1000) {
                this.addOutput('qrcode: la taille doit être entre 50 et 1000 pixels', 'error');
                return;
            }

            // Animation de génération
            const loadingAnimation = this.createLoadingAnimation({
                title: 'Génération du QR Code...',
                progressBarColors: 'from-purple-500 to-blue-500',
                steps: [
                    { text: 'Encodage du texte...', color: 'text-purple-400', delay: 0 },
                    { text: 'Génération du code QR...', color: 'text-blue-400', delay: 300 },
                    { text: 'Optimisation de l\'image...', color: 'text-green-400', delay: 600 }
                ]
            });

            // Créer le QR code en utilisant l'API qr-server.com
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${config.size}x${config.size}&data=${config.text}&color=${config.color}&bgcolor=${config.bgcolor}&format=${config.format}&ecc=${config.errorLevel}`;

            // Tester si l'image se charge correctement
            const img = new Image();
            img.onload = () => {
                loadingAnimation.complete();
                
                // Créer un ID unique pour le QR code
                const qrId = 'qr-' + Date.now();
                
                const qrHTML = `
                    <div class="border border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/20 backdrop-blur-sm mt-3">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-bold text-white">QR Code Généré</h2>
                                    <p class="text-purple-300 text-sm">Prêt à utiliser</p>
                                </div>
                            </div>
                            <div class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                                ✅ Succès
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="text-center">
                                <div class="bg-white p-4 rounded-lg inline-block shadow-lg">
                                    <img id="${qrId}" src="${qrUrl}" alt="QR Code" class="max-w-full h-auto" style="image-rendering: pixelated;">
                                </div>
                                <div class="mt-3 space-x-2">
                                    <button onclick="app.downloadQRCode('${qrId}', '${text.replace(/'/g, "\\'")}', '${config.format}')" 
                                        class="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105">
                                        📥 Télécharger
                                    </button>
                                    <button onclick="navigator.clipboard.writeText('${qrUrl}').then(() => app.addOutput('🔗 URL du QR Code copiée!', 'system'))" 
                                        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105">
                                        🔗 Copier URL
                                    </button>
                                </div>
                            </div>
                            
                            <div class="space-y-3">
                                <h3 class="text-lg font-semibold text-blue-300 flex items-center">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Informations
                                </h3>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                        <span class="text-purple-300 font-medium">Contenu:</span>
                                        <span class="text-white font-mono text-xs max-w-xs truncate">${text.length > 50 ? text.substring(0, 50) + '...' : text}</span>
                                    </div>
                                    <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                        <span class="text-blue-300 font-medium">Taille:</span>
                                        <span class="text-white font-mono">${config.size}x${config.size}px</span>
                                    </div>
                                    <div class="flex justify-between p-2 bg-green-900/30 rounded">
                                        <span class="text-green-300 font-medium">Format:</span>
                                        <span class="text-white font-mono">${config.format.toUpperCase()}</span>
                                    </div>
                                    <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                        <span class="text-yellow-300 font-medium">Niveau d'erreur:</span>
                                        <span class="text-white font-mono">${config.errorLevel}</span>
                                    </div>
                                    <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                        <span class="text-orange-300 font-medium">Couleurs:</span>
                                        <span class="text-white font-mono">#${config.color}/#${config.bgcolor}</span>
                                    </div>
                                </div>
                                
                                <div class="mt-4 p-3 bg-gray-800/50 rounded-lg">
                                    <h4 class="text-sm font-semibold text-gray-300 mb-2">🔗 URL de l'API:</h4>
                                    <div class="bg-gray-900 rounded p-2 text-xs text-gray-400 font-mono break-all">
                                        ${qrUrl}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                this.addOutput(qrHTML, 'system');
            };

            img.onerror = () => {
                loadingAnimation.complete();
                this.addOutput(`
                    <div class="mt-3 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                        <div class="flex items-center mb-2">
                            <span class="text-red-400 mr-2">❌</span>
                            <span class="text-red-300 font-medium">Erreur lors de la génération du QR Code</span>
                        </div>
                        <div class="text-red-400 text-sm">Impossible de générer le QR Code. Vérifiez votre connexion internet.</div>
                    </div>
                `, 'error');
            };

            img.src = qrUrl;
        },

        // Commande pour gérer l'apparence de la console
        appearance(args) {
            if (args.includes('--help') || args.includes('-h')) {
                this.addOutput(`
<span class="text-cyan-400 font-bold">🎨 appearance - Gestion de l'apparence de la console</span>

<span class="text-yellow-400 font-semibold">UTILISATION:</span>
    appearance [OPTION] [VALEUR]

<span class="text-yellow-400 font-semibold">OPTIONS:</span>
    <span class="text-green-400">--timestamps on|off</span>    Afficher/masquer les timestamps
    <span class="text-green-400">--line-numbers on|off</span>  Afficher/masquer les numéros de ligne
    <span class="text-green-400">--status</span>               Afficher l'état actuel des paramètres
    <span class="text-green-400">--reset</span>                Réinitialiser tous les paramètres
    <span class="text-green-400">--test</span>                 Tester l'affichage avec plusieurs lignes

<span class="text-yellow-400 font-semibold">EXEMPLES:</span>
    <span class="text-slate-400">appearance --timestamps on</span>
    <span class="text-slate-400">appearance --line-numbers off</span>
    <span class="text-slate-400">appearance --status</span>
    <span class="text-slate-400">appearance --test</span>

<span class="text-yellow-400 font-semibold">NOTES:</span>
    • Les paramètres sont sauvegardés automatiquement
    • Utilisez les paramètres de la console pour une configuration complète
                `, 'system');
                return;
            }

            // Commande status
            if (args.includes('--status')) {
                const showTimestamps = this.getSetting('show_timestamps', false);
                const showLineNumbers = this.getSetting('show_line_numbers', false);
                
                this.addOutput(`
<span class="text-blue-400 font-bold">📊 État de l'apparence de la console:</span>

<span class="text-yellow-400">Timestamps:</span> ${showTimestamps ? '✅ Activés' : '❌ Désactivés'}
<span class="text-yellow-400">Numéros de ligne:</span> ${showLineNumbers ? '✅ Activés' : '❌ Désactivés'}
<span class="text-yellow-400">Compteur actuel:</span> ${this.lineCounter || 1}

<span class="text-gray-400 text-sm">Utilisez "appearance --help" pour voir les options disponibles</span>
                `, 'system');
                return;
            }

            // Commande reset
            if (args.includes('--reset')) {
                this.applySetting('show_timestamps', false);
                this.applySetting('show_line_numbers', false);
                this.lineCounter = 1;
                
                this.addOutput('🔄 Paramètres d\'apparence réinitialisés', 'system');
                this.addOutput('📝 Exemple de ligne sans formatage', 'normal');
                return;
            }

            // Commande test
            if (args.includes('--test')) {
                this.addOutput('🧪 Test de l\'affichage - Ligne normale', 'normal');
                this.addOutput('⚡ Test de l\'affichage - Ligne de commande', 'command');
                this.addOutput('✅ Test de l\'affichage - Ligne système', 'system');
                this.addOutput('❌ Test de l\'affichage - Ligne d\'erreur', 'error');
                this.addOutput('📊 Test terminé - Vous pouvez voir l\'effet des paramètres d\'apparence', 'system');
                return;
            }

            // Gestion des timestamps
            if (args.includes('--timestamps')) {
                const index = args.indexOf('--timestamps');
                if (index + 1 < args.length) {
                    const value = args[index + 1].toLowerCase();
                    if (value === 'on' || value === 'true' || value === '1') {
                        this.applySetting('show_timestamps', true);
                        this.addOutput('✅ Timestamps activés', 'system');
                        this.addOutput('📝 Cette ligne montre un timestamp', 'normal');
                        return;
                    } else if (value === 'off' || value === 'false' || value === '0') {
                        this.applySetting('show_timestamps', false);
                        this.addOutput('❌ Timestamps désactivés', 'system');
                        return;
                    }
                }
                this.addOutput('❌ Valeur invalide. Utilisez: on/off, true/false, ou 1/0', 'error');
                return;
            }

            // Gestion des numéros de ligne
            if (args.includes('--line-numbers')) {
                const index = args.indexOf('--line-numbers');
                if (index + 1 < args.length) {
                    const value = args[index + 1].toLowerCase();
                    if (value === 'on' || value === 'true' || value === '1') {
                        this.applySetting('show_line_numbers', true);
                        this.addOutput('✅ Numéros de ligne activés', 'system');
                        this.addOutput('📝 Cette ligne montre un numéro', 'normal');
                        return;
                    } else if (value === 'off' || value === 'false' || value === '0') {
                        this.applySetting('show_line_numbers', false);
                        this.addOutput('❌ Numéros de ligne désactivés', 'system');
                        return;
                    }
                }
                this.addOutput('❌ Valeur invalide. Utilisez: on/off, true/false, ou 1/0', 'error');
                return;
            }

            // Si aucune option reconnue, afficher l'aide
            this.addOutput('❌ Option non reconnue. Utilisez "appearance --help" pour voir les options disponibles.', 'error');
        },

        // Nouvelle commande d'optimisation pour éviter les problèmes de stockage
        optimize(args) {
            const options = this.parseOptions(args, {
                'f': 'force',
                'c': 'cleanup',
                'd': 'diagnose',
                's': 'stats',
                'help': 'help'
            });

            if (options.help) {
                this.addOutput(`
                    <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🔧</span>
                            <span class="font-bold text-blue-400 text-xl">Commande optimize - Optimisation du stockage</span>
                        </div>
                        <div class="text-gray-300 text-sm mb-4">Optimise le stockage pour éviter les erreurs HTTP 431 et améliorer les performances</div>
                        
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                <span class="text-blue-300 font-medium">optimize</span>
                                <span class="text-white">Diagnostic et optimisation automatique</span>
                            </div>
                            <div class="flex justify-between p-2 bg-green-900/30 rounded">
                                <span class="text-green-300 font-medium">optimize -c, --cleanup</span>
                                <span class="text-white">Nettoyage forcé des cookies volumineux</span>
                            </div>
                            <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                <span class="text-purple-300 font-medium">optimize -d, --diagnose</span>
                                <span class="text-white">Diagnostic détaillé du stockage</span>
                            </div>
                            <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                <span class="text-yellow-300 font-medium">optimize -s, --stats</span>
                                <span class="text-white">Statistiques de stockage</span>
                            </div>
                            <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                <span class="text-red-300 font-medium">optimize -f, --force</span>
                                <span class="text-white">Optimisation forcée (avec les autres options)</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded">
                            <div class="text-yellow-400 text-xs">
                                💡 <strong>Recommandation:</strong> Exécutez "optimize" régulièrement pour maintenir des performances optimales.
                            </div>
                        </div>
                    </div>
                `, 'system');
                return;
            }

            // Statistiques uniquement
            if (options.stats) {
                this.displayStorageStats();
                return;
            }

            // Diagnostic uniquement
            if (options.diagnose) {
                this.diagnoseAndRepairStorage();
                return;
            }

            // Nettoyage forcé
            if (options.cleanup) {
                this.performCleanup(options.force);
                return;
            }

            // Optimisation complète par défaut
            this.performCompleteOptimization(options.force);
        },

        // Afficher les statistiques de stockage
        displayStorageStats() {
            try {
                this.addOutput(`
                    <div class="border border-green-500 rounded-lg p-4 bg-green-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">📊</span>
                            <span class="font-bold text-green-400 text-xl">Statistiques de stockage</span>
                        </div>
                        <div class="text-gray-300 text-sm mb-2">Analyse de l'utilisation du stockage navigateur...</div>
                    </div>
                `, 'system');

                // Obtenir les statistiques du StorageManager
                if (window.StorageManager && typeof window.StorageManager.getStorageStats === 'function') {
                    const stats = window.StorageManager.getStorageStats();
                    
                    const statsHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div class="bg-purple-900/30 rounded-lg p-4 text-center">
                                <div class="text-2xl font-bold text-purple-300">${stats.localStorageSize} KB</div>
                                <div class="text-xs text-gray-400">localStorage</div>
                                <div class="text-xs text-gray-500">${stats.itemCount} éléments</div>
                            </div>
                            <div class="bg-yellow-900/30 rounded-lg p-4 text-center">
                                <div class="text-2xl font-bold text-yellow-300">${stats.cookieSize} KB</div>
                                <div class="text-xs text-gray-400">Cookies normaux</div>
                            </div>
                            <div class="bg-red-900/30 rounded-lg p-4 text-center">
                                <div class="text-2xl font-bold text-red-300">${stats.fragmentedCookieSize} KB</div>
                                <div class="text-xs text-gray-400">Cookies fragmentés</div>
                                <div class="text-xs text-gray-500">${stats.fragmentedCookieCount} fragments</div>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 ${stats.totalSize > 50 ? 'bg-red-900/20 border-red-600' : 'bg-green-900/20 border-green-600'} border rounded">
                            <div class="text-center">
                                <div class="text-2xl font-bold ${stats.totalSize > 50 ? 'text-red-300' : 'text-green-300'}">${stats.totalSize} KB</div>
                                <div class="text-xs text-gray-400">Utilisation totale</div>
                                <div class="text-xs ${stats.totalSize > 50 ? 'text-red-400' : 'text-green-400'} mt-1">
                                    ${stats.totalSize > 50 ? '⚠️ Élevé - Optimisation recommandée' : '✅ Normal'}
                                </div>
                            </div>
                        </div>
                    `;
                    
                    this.addOutput(statsHTML, 'system');
                } else {
                    this.addOutput('❌ StorageManager non disponible pour les statistiques détaillées', 'error');
                }

                // Statistiques des cookies brutes
                const cookies = document.cookie.split(';');
                let totalCookieSize = 0;
                cookies.forEach(cookie => {
                    totalCookieSize += cookie.length;
                });

                const basicStatsHTML = `
                    <div class="mt-3 p-3 bg-gray-800/30 rounded">
                        <div class="text-xs text-gray-400 space-y-1">
                            <div>🍪 Cookies bruts: ${cookies.length} (${totalCookieSize} caractères)</div>
                            <div>💾 localStorage items: ${localStorage.length}</div>
                            <div>⚡ sessionStorage items: ${sessionStorage.length}</div>
                            <div>🔒 Limite cookies: ~4KB par cookie, ~4MB total</div>
                            <div>📦 Limite localStorage: ~5-10MB selon navigateur</div>
                        </div>
                    </div>
                `;
                
                this.addOutput(basicStatsHTML, 'system');

            } catch (error) {
                this.addOutput(`❌ Erreur lors de l'affichage des statistiques: ${error.message}`, 'error');
            }
        },

        // Effectuer un nettoyage
        performCleanup(force = false) {
            try {
                this.addOutput(`
                    <div class="border border-yellow-500 rounded-lg p-4 bg-yellow-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🧹</span>
                            <span class="font-bold text-yellow-400 text-xl">Nettoyage du stockage</span>
                        </div>
                        <div class="text-gray-300 text-sm">Nettoyage ${force ? 'forcé' : 'standard'} en cours...</div>
                    </div>
                `, 'system');

                let cleanedItems = 0;

                // Nettoyage via StorageManager
                if (window.StorageManager && typeof window.StorageManager.emergencyCleanup === 'function') {
                    cleanedItems = window.StorageManager.emergencyCleanup();
                    this.addOutput(`✅ StorageManager: ${cleanedItems} éléments nettoyés`, 'system');
                }

                // Nettoyage des anciens cookies si mode forcé
                if (force) {
                    this.clearFileSystemCookies();
                    this.clearInodeSystemCookies();
                    this.addOutput('✅ Anciens cookies système supprimés', 'system');
                }

                // Sauvegarder avec les méthodes optimisées
                this.saveFileSystemOptimized();
                if (this.inodeAdapter) {
                    this.saveInodeSystemOptimized();
                }

                this.addOutput(`
                    <div class="mt-3 p-3 bg-green-900/20 border border-green-600 rounded">
                        <div class="text-green-400 text-sm">
                            ✅ Nettoyage terminé avec succès (${cleanedItems} éléments traités)
                        </div>
                    </div>
                `, 'system');

            } catch (error) {
                this.addOutput(`❌ Erreur lors du nettoyage: ${error.message}`, 'error');
            }
        },

        // Optimisation complète
        performCompleteOptimization(force = false) {
            try {
                this.addOutput(`
                    <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">⚡</span>
                            <span class="font-bold text-blue-400 text-xl">Optimisation complète</span>
                        </div>
                        <div class="text-gray-300 text-sm">Diagnostic, nettoyage et optimisation en cours...</div>
                    </div>
                `, 'system');

                // 1. Diagnostic
                this.addOutput('🔍 Phase 1: Diagnostic...', 'system');
                this.diagnoseAndRepairStorage();

                // 2. Nettoyage
                this.addOutput('🧹 Phase 2: Nettoyage...', 'system');
                this.performCleanup(force);

                // 3. Démarrer le nettoyage périodique
                this.addOutput('⏰ Phase 3: Activation du nettoyage automatique...', 'system');
                this.cleanupStoragePeriodically();

                // 4. Statistiques finales
                this.addOutput('📊 Phase 4: Statistiques finales...', 'system');
                this.displayStorageStats();

                this.addOutput(`
                    <div class="mt-3 p-4 bg-green-900/20 border border-green-600 rounded">
                        <div class="text-green-400 font-bold text-center">
                            🎉 Optimisation complète terminée avec succès !
                        </div>
                        <div class="text-xs text-gray-400 text-center mt-2">
                            Le système est maintenant optimisé pour éviter les erreurs HTTP 431
                        </div>
                    </div>
                `, 'system');

            } catch (error) {
                this.addOutput(`❌ Erreur lors de l'optimisation: ${error.message}`, 'error');
            }
        },

        // NOUVELLE COMMANDE: cleanup - Nettoyage spécialisé des duplicatas
        cleanup(args) {
            const options = this.parseOptions(args, {
                'd': 'duplicates',
                'c': 'cookies', 
                'a': 'all',
                'f': 'force',
                'v': 'verbose',
                'help': 'help'
            });

            if (options.help) {
                this.addOutput(`
                    <div class="border border-orange-500 rounded-lg p-4 bg-orange-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🧹</span>
                            <span class="font-bold text-orange-400 text-xl">Commande cleanup - Nettoyage des duplicatas</span>
                        </div>
                        <div class="text-gray-300 text-sm mb-4">Nettoie spécifiquement les données dupliquées pour économiser l'espace</div>
                        
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                <span class="text-orange-300 font-medium">cleanup</span>
                                <span class="text-white">Nettoyage automatique des duplicatas</span>
                            </div>
                            <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                <span class="text-red-300 font-medium">cleanup -d, --duplicates</span>
                                <span class="text-white">Nettoyer uniquement les duplicatas détectés</span>
                            </div>
                            <div class="flex justify-between p-2 bg-yellow-900/30 rounded">
                                <span class="text-yellow-300 font-medium">cleanup -c, --cookies</span>
                                <span class="text-white">Nettoyer uniquement les cookies volumineux</span>
                            </div>
                            <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                <span class="text-purple-300 font-medium">cleanup -a, --all</span>
                                <span class="text-white">Nettoyage complet (duplicatas + cookies)</span>
                            </div>
                            <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                <span class="text-blue-300 font-medium">cleanup -v, --verbose</span>
                                <span class="text-white">Affichage détaillé des opérations</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-red-900/20 border border-red-600 rounded">
                            <div class="text-red-400 text-xs">
                                ⚠️ <strong>Attention:</strong> Cette commande supprime définitivement les données dupliquées.
                            </div>
                        </div>
                    </div>
                `, 'system');
                return;
            }

            // Diagnostic avant nettoyage si verbose
            if (options.verbose) {
                this.addOutput(`
                    <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🔍</span>
                            <span class="font-bold text-blue-400 text-xl">Diagnostic pré-nettoyage</span>
                        </div>
                    </div>
                `, 'system');
                
                // Utiliser la nouvelle fonction de diagnostic complet
                if (typeof window.fullStorageDiagnosis === 'function') {
                    window.fullStorageDiagnosis();
                } else {
                    this.addOutput('❌ Fonction de diagnostic non disponible', 'error');
                }
            }

            try {
                let cleanedBytes = 0;
                let operations = [];

                this.addOutput(`
                    <div class="border border-orange-500 rounded-lg p-4 bg-orange-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🧹</span>
                            <span class="font-bold text-orange-400 text-xl">Nettoyage en cours...</span>
                        </div>
                    </div>
                `, 'system');

                // Nettoyage des duplicatas
                if (options.duplicates || options.all || (!options.cookies && !options.duplicates)) {
                    this.addOutput('🔄 Suppression des duplicatas...', 'system');
                    
                    if (window.StorageManager && typeof window.StorageManager.removeDuplicates === 'function') {
                        const duplicateSavings = window.StorageManager.removeDuplicates();
                        cleanedBytes += duplicateSavings;
                        operations.push(`Duplicatas supprimés: ${Math.round(duplicateSavings/1024*100)/100} KB`);
                        this.addOutput(`✅ Duplicatas supprimés: ${Math.round(duplicateSavings/1024*100)/100} KB économisés`, 'system');
                    } else {
                        this.addOutput('❌ StorageManager non disponible pour les duplicatas', 'error');
                    }
                }

                // Nettoyage des cookies volumineux
                if (options.cookies || options.all) {
                    this.addOutput('🍪 Nettoyage des cookies volumineux...', 'system');
                    
                    if (window.StorageManager && typeof window.StorageManager.removeKnownLargeCookies === 'function') {
                        const cookieSavings = window.StorageManager.removeKnownLargeCookies();
                        cleanedBytes += cookieSavings;
                        operations.push(`Cookies nettoyés: ${Math.round(cookieSavings/1024*100)/100} KB`);
                        this.addOutput(`✅ Cookies volumineux nettoyés: ${Math.round(cookieSavings/1024*100)/100} KB économisés`, 'system');
                    } else {
                        this.addOutput('❌ StorageManager non disponible pour les cookies', 'error');
                    }
                }

                // Nettoyage d'urgence si forcé
                if (options.force) {
                    this.addOutput('🚨 Nettoyage d\'urgence forcé...', 'system');
                    
                    if (window.StorageManager && typeof window.StorageManager.emergencyCleanup === 'function') {
                        const emergencyResult = window.StorageManager.emergencyCleanup();
                        operations.push(`Nettoyage d'urgence: ${emergencyResult} cookies traités`);
                        this.addOutput(`✅ Nettoyage d'urgence terminé: ${emergencyResult} cookies traités`, 'system');
                    }
                }

                // Résumé des opérations
                const totalSavedKB = Math.round(cleanedBytes/1024*100)/100;
                
                this.addOutput(`
                    <div class="mt-3 p-4 bg-green-900/20 border border-green-600 rounded">
                        <div class="text-green-400 font-bold mb-2">
                            🎉 Nettoyage terminé avec succès !
                        </div>
                        <div class="text-sm text-gray-300 space-y-1">
                            <div>💾 <strong>Espace total économisé:</strong> ${totalSavedKB} KB</div>
                            <div>⚡ <strong>Opérations effectuées:</strong> ${operations.length}</div>
                            ${operations.map(op => `<div class="text-xs text-gray-400">• ${op}</div>`).join('')}
                        </div>
                    </div>
                `, 'system');

                // Afficher les statistiques finales si verbose
                if (options.verbose) {
                    this.addOutput('📊 Statistiques après nettoyage:', 'system');
                    if (typeof window.showStorageStats === 'function') {
                        window.showStorageStats();
                    }
                }

            } catch (error) {
                this.addOutput(`❌ Erreur lors du nettoyage: ${error.message}`, 'error');
                console.error('Erreur cleanup:', error);
            }
        },

        // NOUVELLE COMMANDE: cleantabs - Optimisation spécialisée des onglets
        cleantabs(args) {
            const options = this.parseOptions(args, {
                'f': 'force',
                's': 'stats',
                'a': 'aggressive',
                'v': 'verbose',
                'help': 'help'
            });

            if (options.help) {
                this.addOutput(`
                    <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🗂️</span>
                            <span class="font-bold text-blue-400 text-xl">Commande cleantabs - Optimisation des onglets</span>
                        </div>
                        <div class="text-gray-300 text-sm mb-4">Nettoie et optimise les données des onglets pour éviter la croissance excessive</div>
                        
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between p-2 bg-blue-900/30 rounded">
                                <span class="text-blue-300 font-medium">cleantabs</span>
                                <span class="text-white">Nettoyage standard des onglets</span>
                            </div>
                            <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                <span class="text-purple-300 font-medium">cleantabs -s, --stats</span>
                                <span class="text-white">Afficher les statistiques des onglets</span>
                            </div>
                            <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                <span class="text-orange-300 font-medium">cleantabs -a, --aggressive</span>
                                <span class="text-white">Nettoyage agressif (vide l'historique)</span>
                            </div>
                            <div class="flex justify-between p-2 bg-green-900/30 rounded">
                                <span class="text-green-300 font-medium">cleantabs -v, --verbose</span>
                                <span class="text-white">Mode détaillé avec diagnostic</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded">
                            <div class="text-yellow-400 text-xs">
                                💡 <strong>Info:</strong> Cette commande optimise les données console_tabs qui grossissent à chaque commande.
                            </div>
                        </div>
                    </div>
                `, 'system');
                return;
            }

            try {
                this.addOutput(`
                    <div class="border border-blue-500 rounded-lg p-4 bg-blue-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🗂️</span>
                            <span class="font-bold text-blue-400 text-xl">Optimisation des onglets en cours...</span>
                        </div>
                    </div>
                `, 'system');

                // Statistiques avant nettoyage
                if (options.stats || options.verbose) {
                    this.showTabsStatistics('avant nettoyage');
                }

                let cleanedData = {
                    beforeSize: 0,
                    afterSize: 0,
                    outputHistoryCleaned: 0,
                    commandHistoryCleaned: 0,
                    tabsOptimized: 0
                };

                // Accéder au TabManager
                if (window.TabManager || this.tabManager) {
                    const tabManager = window.TabManager || this.tabManager;
                    
                    if (typeof tabManager.cleanupTabsData === 'function') {
                        // Calculer la taille avant
                        const beforeData = localStorage.getItem('console_tabs');
                        cleanedData.beforeSize = beforeData ? beforeData.length : 0;

                        if (options.aggressive) {
                            this.addOutput('🧹 Nettoyage agressif des onglets...', 'system');
                            
                            // Nettoyage agressif : vider tout l'historique
                            tabManager.tabs.forEach(tab => {
                                if (tab.outputHistory && tab.outputHistory.length > 0) {
                                    cleanedData.outputHistoryCleaned += tab.outputHistory.length;
                                    tab.outputHistory = [];
                                }
                                if (tab.history && tab.history.length > 0) {
                                    cleanedData.commandHistoryCleaned += tab.history.length;
                                    tab.history = [];
                                    tab.historyIndex = -1;
                                }
                                cleanedData.tabsOptimized++;
                            });
                            
                        } else {
                            this.addOutput('🔧 Nettoyage standard des onglets...', 'system');
                        }

                        // Effectuer le nettoyage
                        tabManager.cleanupTabsData();
                        tabManager.resetCounters();
                        
                        // Calculer la taille après
                        const afterData = localStorage.getItem('console_tabs');
                        cleanedData.afterSize = afterData ? afterData.length : 0;
                        
                        const savedBytes = cleanedData.beforeSize - cleanedData.afterSize;
                        const savedKB = Math.round(savedBytes / 1024 * 100) / 100;

                        this.addOutput(`✅ Nettoyage des onglets terminé`, 'system');
                        
                        // Résultats détaillés
                        this.addOutput(`
                            <div class="mt-3 p-4 bg-green-900/20 border border-green-600 rounded">
                                <div class="text-green-400 font-bold mb-2">
                                    📊 Résultats du nettoyage
                                </div>
                                <div class="text-sm text-gray-300 space-y-1">
                                    <div>💾 <strong>Espace économisé:</strong> ${savedKB} KB (${savedBytes} bytes)</div>
                                    <div>🗂️ <strong>Onglets optimisés:</strong> ${cleanedData.tabsOptimized}</div>
                                    ${cleanedData.outputHistoryCleaned > 0 ? `<div>📝 <strong>Éléments d'historique supprimés:</strong> ${cleanedData.outputHistoryCleaned}</div>` : ''}
                                    ${cleanedData.commandHistoryCleaned > 0 ? `<div>⌨️ <strong>Commandes d'historique supprimées:</strong> ${cleanedData.commandHistoryCleaned}</div>` : ''}
                                    <div>📏 <strong>Taille avant:</strong> ${Math.round(cleanedData.beforeSize/1024*100)/100} KB</div>
                                    <div>📏 <strong>Taille après:</strong> ${Math.round(cleanedData.afterSize/1024*100)/100} KB</div>
                                </div>
                            </div>
                        `, 'system');

                    } else {
                        this.addOutput('❌ TabManager.cleanupTabsData() non disponible', 'error');
                    }
                } else {
                    this.addOutput('❌ TabManager non disponible', 'error');
                }

                // Statistiques après nettoyage
                if (options.stats || options.verbose) {
                    this.showTabsStatistics('après nettoyage');
                }

            } catch (error) {
                this.addOutput(`❌ Erreur lors du nettoyage des onglets: ${error.message}`, 'error');
                console.error('Erreur cleantabs:', error);
            }
        },

        // NOUVELLE MÉTHODE: Afficher les statistiques des onglets
        showTabsStatistics(phase = '') {
            try {
                const tabsData = localStorage.getItem('console_tabs');
                const tabsMinimal = localStorage.getItem('console_tabs_minimal');
                
                let totalSize = 0;
                let tabCount = 0;
                let totalOutputHistory = 0;
                let totalCommandHistory = 0;

                if (tabsData) {
                    totalSize += tabsData.length;
                    try {
                        const parsed = JSON.parse(tabsData);
                        tabCount = parsed.tabs ? parsed.tabs.length : 0;
                        
                        if (parsed.tabs) {
                            parsed.tabs.forEach(tab => {
                                totalOutputHistory += (tab.outputHistory || []).length;
                                totalCommandHistory += (tab.history || []).length;
                            });
                        }
                    } catch (e) {
                        console.warn('Erreur parsing tabs data:', e);
                    }
                }

                if (tabsMinimal) {
                    totalSize += tabsMinimal.length;
                }

                this.addOutput(`
                    <div class="mt-2 p-3 bg-purple-900/20 border border-purple-600 rounded">
                        <div class="text-purple-400 font-bold mb-2">
                            📊 Statistiques des onglets ${phase}
                        </div>
                        <div class="text-sm text-gray-300 space-y-1">
                            <div>🗂️ <strong>Nombre d'onglets:</strong> ${tabCount}</div>
                            <div>💾 <strong>Taille totale:</strong> ${Math.round(totalSize/1024*100)/100} KB (${totalSize} bytes)</div>
                            <div>📝 <strong>Total historique sortie:</strong> ${totalOutputHistory} éléments</div>
                            <div>⌨️ <strong>Total historique commandes:</strong> ${totalCommandHistory} éléments</div>
                            <div>📅 <strong>Timestamp:</strong> ${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                `, 'system');

            } catch (error) {
                this.addOutput(`❌ Erreur affichage statistiques: ${error.message}`, 'error');
            }
        },

        // NOUVELLE COMMANDE: debugtabs - Diagnostic des problèmes d'onglets
        debugtabs(args) {
            const options = this.parseOptions(args, {
                'f': 'fix',
                'r': 'reload',
                'c': 'clear',
                'd': 'display',
                'help': 'help'
            });

            if (options.help) {
                this.addOutput(`
                    <div class="border border-cyan-500 rounded-lg p-4 bg-cyan-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🔧</span>
                            <span class="font-bold text-cyan-400 text-xl">Commande debugtabs - Diagnostic des onglets</span>
                        </div>
                        <div class="text-gray-300 text-sm mb-4">Diagnostique et résout les problèmes de sauvegarde/chargement des onglets</div>
                        
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between p-2 bg-cyan-900/30 rounded">
                                <span class="text-cyan-300 font-medium">debugtabs</span>
                                <span class="text-white">Diagnostic complet des onglets</span>
                            </div>
                            <div class="flex justify-between p-2 bg-green-900/30 rounded">
                                <span class="text-green-300 font-medium">debugtabs -f, --fix</span>
                                <span class="text-white">Tenter de corriger les problèmes détectés</span>
                            </div>
                            <div class="flex justify-between p-2 bg-purple-900/30 rounded">
                                <span class="text-purple-300 font-medium">debugtabs -d, --display</span>
                                <span class="text-white">Corriger les problèmes d'affichage (CLK, UI GitHub)</span>
                            </div>
                            <div class="flex justify-between p-2 bg-orange-900/30 rounded">
                                <span class="text-orange-300 font-medium">debugtabs -r, --reload</span>
                                <span class="text-white">Forcer le rechargement des onglets</span>
                            </div>
                            <div class="flex justify-between p-2 bg-red-900/30 rounded">
                                <span class="text-red-300 font-medium">debugtabs -c, --clear</span>
                                <span class="text-white">Réinitialiser complètement les onglets</span>
                            </div>
                        </div>
                    </div>
                `, 'system');
                return;
            }

            try {
                this.addOutput(`
                    <div class="border border-cyan-500 rounded-lg p-4 bg-cyan-900/20 backdrop-blur-sm">
                        <div class="flex items-center mb-3">
                            <span class="text-2xl mr-2">🔍</span>
                            <span class="font-bold text-cyan-400 text-xl">Diagnostic des onglets</span>
                        </div>
                    </div>
                `, 'system');

                // Accéder au TabManager
                const tabManager = window.TabManager || this.tabManager;
                
                if (!tabManager) {
                    this.addOutput('❌ TabManager non disponible', 'error');
                    return;
                }

                // Exécuter le diagnostic
                let diagnosticResult = null;
                if (typeof tabManager.debugTabsStorage === 'function') {
                    diagnosticResult = tabManager.debugTabsStorage();
                } else {
                    this.addOutput('❌ Fonction de diagnostic non disponible', 'error');
                    return;
                }

                // Afficher les résultats du diagnostic
                this.addOutput(`
                    <div class="mt-3 p-4 bg-gray-900/20 border border-gray-600 rounded">
                        <div class="text-gray-300 font-bold mb-2">
                            📊 Résultats du diagnostic
                        </div>
                        <div class="text-sm text-gray-300 space-y-1">
                            <div>📋 <strong>localStorage direct:</strong> ${diagnosticResult.directTabs ? '✅ TROUVÉ' : '❌ VIDE'}</div>
                            <div>📋 <strong>localStorage avec préfixe:</strong> ${diagnosticResult.prefixTabs ? '✅ TROUVÉ' : '❌ VIDE'}</div>
                            <div>📋 <strong>Sauvegarde minimale:</strong> ${diagnosticResult.minimalTabs ? '✅ TROUVÉ' : '❌ VIDE'}</div>
                            <div>🔧 <strong>StorageManager:</strong> ${diagnosticResult.storageManager ? '✅ FONCTIONNEL' : '❌ PROBLÈME'}</div>
                            <div>🍪 <strong>Cookie de sauvegarde:</strong> ${diagnosticResult.cookieBackup ? '✅ TROUVÉ' : '❌ VIDE'}</div>
                            <div>🗂️ <strong>Onglets chargés:</strong> ${diagnosticResult.currentTabsCount}</div>
                            <div>🎯 <strong>Onglet actif:</strong> ${diagnosticResult.activeTabId || 'AUCUN'}</div>
                        </div>
                    </div>
                `, 'system');

                // Corriger automatiquement si demandé
                if (options.fix) {
                    this.addOutput('🔧 Tentative de correction automatique...', 'system');
                    
                    if (!diagnosticResult.directTabs && diagnosticResult.prefixTabs) {
                        // Copier les données du préfixe vers le direct
                        const prefixData = localStorage.getItem('clk_console_tabs');
                        if (prefixData) {
                            localStorage.setItem('console_tabs', prefixData);
                            this.addOutput('✅ Données copiées de clk_console_tabs vers console_tabs', 'system');
                        }
                    }
                    
                    if (diagnosticResult.currentTabsCount === 0) {
                        // Forcer la création du premier onglet
                        if (typeof tabManager.createFirstTab === 'function') {
                            tabManager.createFirstTab();
                            this.addOutput('✅ Premier onglet créé', 'system');
                        }
                    }
                }

                // Corriger les problèmes d'affichage si demandé
                if (options.display) {
                    this.addOutput('🎨 Correction des problèmes d\'affichage...', 'system');
                    
                    if (typeof tabManager.fixDisplayIssues === 'function') {
                        const fixedCount = tabManager.fixDisplayIssues();
                        if (fixedCount > 0) {
                            this.addOutput(`✅ ${fixedCount} éléments d'affichage corrigés (CLK, UI GitHub, dessins ASCII)`, 'success');
                            this.addOutput('🔄 Rechargement de l\'onglet actif pour appliquer les corrections...', 'system');
                            
                            // Recharger la page pour appliquer les corrections
                            setTimeout(() => {
                                if (typeof tabManager.loadTabState === 'function' && tabManager.activeTabId) {
                                    tabManager.loadTabState(tabManager.activeTabId);
                                }
                            }, 500);
                        } else {
                            this.addOutput('ℹ️ Aucun problème d\'affichage détecté', 'info');
                        }
                    } else {
                        this.addOutput('❌ Fonction de correction d\'affichage non disponible', 'error');
                    }
                }

                // Forcer le rechargement si demandé
                if (options.reload) {
                    this.addOutput('🔄 Rechargement forcé des onglets...', 'system');
                    
                    if (typeof tabManager.loadTabsFromCookie === 'function') {
                        tabManager.loadTabsFromCookie();
                        this.addOutput('✅ Onglets rechargés', 'system');
                    }
                }

                // Réinitialiser complètement si demandé
                if (options.clear) {
                    if (confirm && confirm('⚠️ Réinitialiser complètement tous les onglets ?')) {
                        this.addOutput('🗑️ Réinitialisation complète des onglets...', 'warning');
                        
                        // Supprimer toutes les données des onglets
                        localStorage.removeItem('console_tabs');
                        localStorage.removeItem('clk_console_tabs');
                        localStorage.removeItem('console_tabs_minimal');
                        document.cookie = 'console_tabs_backup=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        
                        // Recréer le premier onglet
                        if (typeof tabManager.createFirstTab === 'function') {
                            tabManager.tabs = [];
                            tabManager.activeTabId = null;
                            tabManager.nextTabId = 1;
                            tabManager.createFirstTab();
                            this.addOutput('✅ Onglets réinitialisés avec succès', 'success');
                        }
                    }
                }

            } catch (error) {
                this.addOutput(`❌ Erreur lors du diagnostic: ${error.message}`, 'error');
                console.error('Erreur debugtabs:', error);
            }
        }



    }
export default commands;