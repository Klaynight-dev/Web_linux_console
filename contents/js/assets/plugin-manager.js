class PluginManager {
    constructor(pluginsDir = 'plugins') {
        this.loadedPlugins = new Map();
        this.tempPlugins = new Map(); // Pour les plugins importés directement
        this.tempPluginsCode = new Map(); // Pour stocker le code des plugins temporaires
        this.pluginsDir = pluginsDir;
        this.pluginsPath = `./${pluginsDir}/`;
        this.pluginStates = new Map(); // État d'activation des plugins
        this.cookieName = 'clk_plugins_config';
        
        // Charger la configuration depuis les cookies
        this.loadPluginConfigFromCookie();
    }

    // Gestion des cookies pour la configuration des plugins
    loadPluginConfigFromCookie() {
        try {
            const cookieValue = this.getCookie(this.cookieName);
            if (cookieValue) {
                const config = JSON.parse(decodeURIComponent(cookieValue));
                
                // Restaurer les plugins temporaires
                if (config.tempPlugins) {
                    for (const [name, data] of Object.entries(config.tempPlugins)) {
                        this.tempPluginsCode.set(name, data.code);
                        this.pluginStates.set(name, data.enabled !== false);
                        
                        // Charger le plugin si activé
                        if (data.enabled !== false) {
                            this.importPluginFromCode(data.code, name, false); // false = ne pas sauvegarder
                        }
                    }
                }
                
                // Restaurer les états des plugins permanents
                if (config.pluginStates) {
                    for (const [name, enabled] of Object.entries(config.pluginStates)) {
                        this.pluginStates.set(name, enabled);
                    }
                }
            }
        } catch (error) {
            console.warn('Erreur lors du chargement de la configuration des plugins:', error.message);
        }
    }

    savePluginConfigToCookie() {
        try {
            const config = {
                tempPlugins: {},
                pluginStates: {}
            };
            
            // Sauvegarder les plugins temporaires
            for (const [name, code] of this.tempPluginsCode.entries()) {
                config.tempPlugins[name] = {
                    code: code,
                    enabled: this.pluginStates.get(name) !== false
                };
            }
            
            // Sauvegarder les états des plugins
            for (const [name, enabled] of this.pluginStates.entries()) {
                config.pluginStates[name] = enabled;
            }
            
            const cookieValue = encodeURIComponent(JSON.stringify(config));
            this.setCookie(this.cookieName, cookieValue, 365);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration des plugins:', error.message);
        }
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    // Méthode pour exporter la configuration des plugins
    exportPluginConfig() {
        try {
            const config = {
                tempPlugins: {},
                pluginStates: {},
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            // Exporter tous les plugins temporaires
            for (const [name, code] of this.tempPluginsCode.entries()) {
                config.tempPlugins[name] = {
                    code: code,
                    enabled: this.pluginStates.get(name) !== false
                };
            }
            
            // Exporter les états des plugins
            for (const [name, enabled] of this.pluginStates.entries()) {
                config.pluginStates[name] = enabled;
            }
            
            return JSON.stringify(config, null, 2);
        } catch (error) {
            console.error('Erreur lors de l\'export de la configuration:', error.message);
            return null;
        }
    }

    // Méthode pour importer la configuration des plugins
    importPluginConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            
            if (!config.tempPlugins && !config.pluginStates) {
                throw new Error('Configuration invalide');
            }
            
            let importedCount = 0;
            
            // Importer les plugins temporaires
            if (config.tempPlugins) {
                for (const [name, data] of Object.entries(config.tempPlugins)) {
                    this.tempPluginsCode.set(name, data.code);
                    this.pluginStates.set(name, data.enabled !== false);
                    
                    // Charger le plugin si activé
                    if (data.enabled !== false) {
                        this.importPluginFromCode(data.code, name, false);
                    }
                    importedCount++;
                }
            }
            
            // Importer les états des plugins
            if (config.pluginStates) {
                for (const [name, enabled] of Object.entries(config.pluginStates)) {
                    this.pluginStates.set(name, enabled);
                }
            }
            
            // Sauvegarder la nouvelle configuration
            this.savePluginConfigToCookie();
            
            return {
                success: true,
                imported: importedCount,
                message: `${importedCount} plugin(s) importé(s) avec succès`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async loadAllPlugins() {
        try {
            // Charger la liste des plugins depuis un endpoint ou fichier de configuration
            // Pour l'instant, on charge les plugins connus
            const knownPlugins = ['exemple']; // Liste des plugins disponibles
            
            for (const pluginName of knownPlugins) {
                try {
                    // Vérifier si le plugin est activé
                    if (this.pluginStates.get(pluginName) !== false) {
                        await this.loadPlugin(pluginName);
                    }
                } catch (error) {
                    console.warn(`Échec du chargement du plugin ${pluginName}:`, error.message);
                }
            }
        } catch (error) {
            console.warn('Erreur lors du chargement des plugins:', error.message);
        }
    }

    async loadPlugin(pluginName) {
        try {
            // Charger le manifest du plugin
            const manifestResponse = await fetch(`${this.pluginsPath}${pluginName}/manifest.json`);
            if (!manifestResponse.ok) {
                throw new Error(`Manifest manquant pour le plugin ${pluginName}`);
            }
            
            const manifest = await manifestResponse.json();
            
            // Charger le fichier principal du plugin
            const mainResponse = await fetch(`${this.pluginsPath}${pluginName}/${manifest.main}`);
            if (!mainResponse.ok) {
                throw new Error(`Fichier principal manquant: ${manifest.main}`);
            }
            
            const pluginCode = await mainResponse.text();
            
            // Évaluer le code du plugin dans un contexte sécurisé
            const pluginModule = this.evaluatePluginCode(pluginCode, pluginName);
            const commands = [];

            // Utiliser les informations du manifest pour enrichir les commandes
            for (const [commandName, commandInfo] of Object.entries(manifest.commands || {})) {
                if (pluginModule[commandName] && typeof pluginModule[commandName].execute === 'function') {
                    const command = { ...pluginModule[commandName] };
                    // Enrichir avec les infos du manifest
                    command.manifestInfo = commandInfo;
                    command.description = commandInfo.description || command.description;
                    commands.push(command);
                }
            }

            // Stocker les informations du plugin avec le manifest
            this.loadedPlugins.set(pluginName, {
                commands: commands,
                manifest: manifest
            });
            
            console.log(`Plugin ${manifest.name} v${manifest.version} chargé avec ${commands.length} commande(s)`);
            
        } catch (error) {
            console.error(`Erreur lors du chargement du plugin ${pluginName}:`, error.message);
            throw error;
        }
    }

    evaluatePluginCode(code, pluginName) {
        try {
            // Créer un contexte d'exécution sécurisé pour le navigateur
            const module = { exports: {} };
            const exports = module.exports;
            
            // Créer une fonction qui évalue le code du plugin
            const func = new Function('module', 'exports', 'console', code);
            func(module, exports, console);
            
            return module.exports;
        } catch (error) {
            throw new Error(`Erreur lors de l'évaluation du plugin ${pluginName}: ${error.message}`);
        }
    }

    // Nouvelle méthode pour importer un plugin depuis du code
    importPluginFromCode(pluginCode, pluginName = null, saveToConfig = true) {
        try {
            // Créer un contexte d'exécution sécurisé
            const module = { exports: {} };
            const exports = module.exports;

            // Exécuter le code du plugin
            const func = new Function('module', 'exports', 'console', pluginCode);
            func(module, exports, console);

            // Extraire les commandes du module
            const commands = [];
            const exportedCommands = module.exports;

            for (const [key, value] of Object.entries(exportedCommands)) {
                if (value && typeof value.execute === 'function' && value.name && value.description) {
                    commands.push(value);
                }
            }

            if (commands.length === 0) {
                throw new Error('Aucune commande valide trouvée dans le code');
            }

            // Générer un nom si non fourni
            const finalPluginName = pluginName || `imported_${Date.now()}`;
            
            // Stocker dans les plugins temporaires
            this.tempPlugins.set(finalPluginName, commands);
            this.tempPluginsCode.set(finalPluginName, pluginCode);
            this.pluginStates.set(finalPluginName, true); // Activé par défaut
            
            // Sauvegarder en cookie si demandé
            if (saveToConfig) {
                this.savePluginConfigToCookie();
            }
            
            console.log(`Plugin ${finalPluginName} importé avec ${commands.length} commande(s)`);
            return {
                success: true,
                name: finalPluginName,
                commands: commands.map(cmd => cmd.name)
            };

        } catch (error) {
            console.error('Erreur lors de l\'import du plugin:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Méthode pour activer/désactiver un plugin
    togglePlugin(pluginName, enabled = null) {
        const currentState = this.pluginStates.get(pluginName);
        const newState = enabled !== null ? enabled : !currentState;
        
        this.pluginStates.set(pluginName, newState);
        
        if (newState) {
            // Activer le plugin
            if (this.tempPluginsCode.has(pluginName)) {
                const code = this.tempPluginsCode.get(pluginName);
                this.importPluginFromCode(code, pluginName, false);
            }
        } else {
            // Désactiver le plugin - on garde les données mais on les retire de l'exécution
            this.tempPlugins.delete(pluginName);
            // Ne pas supprimer de loadedPlugins pour garder les infos du manifest
        }
        
        this.savePluginConfigToCookie();
        return newState;
    }

    // Méthode pour supprimer complètement un plugin
    removePlugin(pluginName) {
        this.tempPlugins.delete(pluginName);
        this.tempPluginsCode.delete(pluginName);
        this.loadedPlugins.delete(pluginName);
        this.pluginStates.delete(pluginName);
        this.savePluginConfigToCookie();
        return true;
    }

    // Méthode pour sauvegarder un plugin temporaire (simulation côté client)
    saveImportedPlugin(pluginName, pluginCode = null) {
        try {
            const codeToSave = pluginCode || this.tempPluginsCode.get(pluginName);
            if (!codeToSave) {
                throw new Error('Code du plugin non trouvé');
            }

            // Dans un environnement navigateur, on simule la sauvegarde
            // En réalité, cela devrait être envoyé au serveur
            console.log(`Plugin ${pluginName} sauvegardé (simulation côté client)`);
            
            // Déplacer des plugins temporaires vers permanents
            const commands = this.tempPlugins.get(pluginName);
            if (commands) {
                this.loadedPlugins.set(pluginName, commands);
                this.tempPlugins.delete(pluginName);
                this.tempPluginsCode.delete(pluginName);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getCommand(commandName) {
        // Chercher d'abord dans les plugins permanents activés
        for (const [pluginName, pluginData] of this.loadedPlugins.entries()) {
            if (this.pluginStates.get(pluginName) !== false) {
                const commands = Array.isArray(pluginData) ? pluginData : pluginData.commands;
                const command = commands.find(cmd => cmd.name === commandName);
                if (command) return command;
            }
        }

        // Puis dans les plugins temporaires activés
        for (const [pluginName, commands] of this.tempPlugins.entries()) {
            if (this.pluginStates.get(pluginName) !== false) {
                const command = commands.find(cmd => cmd.name === commandName);
                if (command) return command;
            }
        }

        return undefined;
    }

    getAllCommands() {
        const allCommands = [];
        
        // Commands des plugins permanents activés
        for (const [pluginName, pluginData] of this.loadedPlugins.entries()) {
            if (this.pluginStates.get(pluginName) !== false) {
                const commands = Array.isArray(pluginData) ? pluginData : pluginData.commands;
                allCommands.push(...commands);
            }
        }
        
        // Commands des plugins temporaires activés
        for (const [pluginName, commands] of this.tempPlugins.entries()) {
            if (this.pluginStates.get(pluginName) !== false) {
                allCommands.push(...commands);
            }
        }
        
        return allCommands;
    }

    listPlugins() {
        const plugins = [];
        const allPluginNames = new Set();
        
        // Collecter tous les noms de plugins
        for (const name of this.loadedPlugins.keys()) {
            allPluginNames.add(name);
        }
        for (const name of this.tempPlugins.keys()) {
            allPluginNames.add(name);
        }
        for (const name of this.tempPluginsCode.keys()) {
            allPluginNames.add(name);
        }
        for (const name of this.pluginStates.keys()) {
            allPluginNames.add(name);
        }
        
        // Traiter chaque plugin
        for (const name of allPluginNames) {
            const isEnabled = this.pluginStates.get(name) !== false;
            let commands = [];
            let type = 'permanent';
            
            // Déterminer le type et les commandes
            if (this.tempPluginsCode.has(name)) {
                type = 'temporary';
                if (isEnabled && this.tempPlugins.has(name)) {
                    commands = this.tempPlugins.get(name).map(cmd => cmd.name);
                } else if (isEnabled && this.loadedPlugins.has(name)) {
                    const pluginData = this.loadedPlugins.get(name);
                    const cmdList = Array.isArray(pluginData) ? pluginData : pluginData.commands;
                    commands = cmdList.map(cmd => cmd.name);
                } else {
                    // Plugin désactivé, extraire les noms de commandes du code stocké
                    try {
                        const code = this.tempPluginsCode.get(name);
                        const module = { exports: {} };
                        const func = new Function('module', 'exports', 'console', code);
                        func(module, exports, console);
                        
                        for (const [key, value] of Object.entries(module.exports)) {
                            if (value && typeof value.execute === 'function' && value.name && value.description) {
                                commands.push(value.name);
                            }
                        }
                    } catch (error) {
                        console.warn(`Impossible d'extraire les commandes du plugin ${name}:`, error.message);
                        commands = [];
                    }
                }
            } else if (this.loadedPlugins.has(name)) {
                const pluginData = this.loadedPlugins.get(name);
                const cmdList = Array.isArray(pluginData) ? pluginData : pluginData.commands;
                commands = cmdList.map(cmd => cmd.name);
            } else if (this.tempPlugins.has(name)) {
                type = 'temporary';
                commands = this.tempPlugins.get(name).map(cmd => cmd.name);
            }
            
            plugins.push({
                name: name,
                type: type,
                enabled: isEnabled,
                commands: commands
            });
        }
        
        return plugins.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Nouvelle méthode pour supprimer un plugin temporaire
    removeTemporaryPlugin(pluginName) {
        const deleted = this.tempPlugins.delete(pluginName);
        this.tempPluginsCode.delete(pluginName);
        this.pluginStates.delete(pluginName);
        this.savePluginConfigToCookie();
        return deleted;
    }

    // Méthode pour obtenir les informations détaillées d'un plugin
    getPluginInfo(pluginName) {
        const info = {
            name: pluginName,
            version: 'Non spécifiée',
            author: 'Non spécifié',
            description: 'Aucune description disponible',
            commands: [],
            type: 'unknown',
            enabled: this.pluginStates.get(pluginName) !== false
        };

        try {
            // Pour les plugins permanents chargés
            if (this.loadedPlugins.has(pluginName)) {
                info.type = 'permanent';
                const pluginData = this.loadedPlugins.get(pluginName);
                
                if (pluginData.manifest) {
                    // Utiliser les informations du manifest
                    info.name = pluginData.manifest.name || pluginName;
                    info.version = pluginData.manifest.version || info.version;
                    info.author = pluginData.manifest.author || info.author;
                    info.description = pluginData.manifest.description || info.description;
                    
                    // Extraire les commandes avec leurs descriptions du manifest
                    const commands = Array.isArray(pluginData) ? pluginData : pluginData.commands;
                    for (const cmd of commands) {
                        const manifestCommandInfo = pluginData.manifest.commands[cmd.name];
                        info.commands.push({
                            name: cmd.name,
                            description: manifestCommandInfo ? manifestCommandInfo.description : cmd.description,
                            category: manifestCommandInfo ? manifestCommandInfo.category : 'General',
                            synopsis: manifestCommandInfo ? manifestCommandInfo.synopsis : cmd.usage || cmd.name,
                            examples: manifestCommandInfo ? manifestCommandInfo.examples : []
                        });
                    }
                } else {
                    // Fallback pour les anciens plugins sans manifest
                    const commands = Array.isArray(pluginData) ? pluginData : pluginData.commands;
                    info.commands = commands.map(cmd => ({
                        name: cmd.name,
                        description: cmd.description || 'Aucune description'
                    }));
                }
            }
            // Pour les plugins temporaires
            else if (this.tempPluginsCode.has(pluginName)) {
                info.type = 'temporary';
                const code = this.tempPluginsCode.get(pluginName);
                const module = { exports: {} };
                const func = new Function('module', 'exports', 'console', code);
                func(module, exports, console);

                // Extraire les métadonnées du plugin
                const pluginData = module.exports;
                if (pluginData.pluginInfo) {
                    info.version = pluginData.pluginInfo.version || info.version;
                    info.author = pluginData.pluginInfo.author || info.author;
                    info.description = pluginData.pluginInfo.description || info.description;
                }

                // Extraire les commandes
                for (const [key, value] of Object.entries(pluginData)) {
                    if (value && typeof value.execute === 'function' && value.name && value.description) {
                        info.commands.push({
                            name: value.name,
                            description: value.description,
                            category: value.category || 'General',
                            synopsis: value.usage || value.name,
                            examples: value.examples || []
                        });
                    }
                }
            }
            // Pour les plugins temporaires en mémoire
            else if (this.tempPlugins.has(pluginName)) {
                info.type = 'temporary';
                const commands = this.tempPlugins.get(pluginName);
                info.commands = commands.map(cmd => ({
                    name: cmd.name,
                    description: cmd.description || 'Aucune description',
                    category: cmd.category || 'General',
                    synopsis: cmd.usage || cmd.name,
                    examples: cmd.examples || []
                }));
            }
        } catch (error) {
            console.warn(`Erreur lors de la récupération des infos du plugin ${pluginName}:`, error.message);
        }

        return info;
    }
}

// Export pour ES6 modules (navigateur)
export { PluginManager };
