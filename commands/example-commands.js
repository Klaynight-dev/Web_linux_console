// Exemple de commandes personnalisées

// Commande simple
registerCommand('hello', function(args) {
    const name = args.join(' ') || 'Monde';
    context.addOutput(`👋 Bonjour ${name}!`, 'system');
});

// Commande avec interaction avec le système de fichiers
registerCommand('count', function(args) {
    const targetPath = args[0] || '.';
    const resolvedPath = context.resolvePath(targetPath);
    const targetNode = context.getPath(resolvedPath);
    
    if (!targetNode) {
        context.addOutput(`count: ${targetPath}: Aucun fichier ou dossier de ce type`, 'error');
        return;
    }
    
    if (targetNode.type !== 'directory') {
        context.addOutput(`count: ${targetPath}: N'est pas un dossier`, 'error');
        return;
    }
    
    const children = Object.keys(targetNode.children);
    const files = children.filter(name => targetNode.children[name].type === 'file').length;
    const dirs = children.filter(name => targetNode.children[name].type === 'directory').length;
    
    context.addOutput(`📊 Statistiques de ${resolvedPath}:`);
    context.addOutput(`  Dossiers: ${dirs}`);
    context.addOutput(`  Fichiers: ${files}`);
    context.addOutput(`  Total: ${children.length}`);
});

// Commande avec historique
registerCommand('lastcmd', function(args) {
    if (context.history.length === 0) {
        context.addOutput('Aucune commande dans l\'historique', 'system');
        return;
    }
    
    const lastCommand = context.history[context.history.length - 1];
    context.addOutput(`📝 Dernière commande: ${lastCommand.cmd}`);
    context.addOutput(`🕒 Exécutée le: ${lastCommand.date} à ${lastCommand.time}`);
});

// Commande avec création de fichier
registerCommand('note', function(args) {
    if (args.length === 0) {
        context.addOutput('note: utilisation: note <message>', 'error');
        return;
    }
    
    const message = args.join(' ');
    const currentNode = context.getPath(context.currentDir);
    const timestamp = new Date().toLocaleString();
    const filename = `note_${Date.now()}.txt`;
    
    currentNode.children[filename] = {
        type: 'file',
        content: `Note créée le ${timestamp}\n\n${message}`
    };
    
    context.saveFileSystemToCookie();
    context.addOutput(`📝 Note sauvegardée dans ${filename}`, 'system');
});

// Commande avancée avec options
registerCommand('search', function(args) {
    const options = context.utils.parseOptions(args, {
        'i': 'ignore-case',
        'r': 'recursive'
    });
    
    if (options._.length === 0) {
        context.addOutput('search: utilisation: search [-i] [-r] <terme>', 'error');
        return;
    }
    
    const searchTerm = options._[0];
    const flags = options['ignore-case'] ? 'gi' : 'g';
    const regex = new RegExp(searchTerm, flags);
    
    const searchInNode = (node, path) => {
        const results = [];
        
        if (node.type === 'file' && regex.test(node.content)) {
            results.push(path);
        }
        
        if (node.type === 'directory' && options.recursive) {
            Object.keys(node.children).forEach(childName => {
                const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
                results.push(...searchInNode(node.children[childName], childPath));
            });
        }
        
        return results;
    };
    
    const startNode = context.getPath(context.currentDir);
    const results = searchInNode(startNode, context.currentDir);
    
    if (results.length === 0) {
        context.addOutput(`🔍 Aucun résultat trouvé pour "${searchTerm}"`, 'system');
    } else {
        context.addOutput(`🔍 ${results.length} résultat(s) trouvé(s) pour "${searchTerm}":`);
        results.forEach(result => context.addOutput(`  ${result}`));
    }
});

console.log('✅ Commandes personnalisées chargées: hello, count, lastcmd, note, search');