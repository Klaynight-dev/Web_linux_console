const greet = {
    name: 'greet',
    description: 'Salue l\'utilisateur',
    usage: 'greet [nom]',
    execute: function(args) {
        const name = args.length > 0 ? args.join(' ') : 'utilisateur';
        this.addOutput(`Bonjour ${name}! 👋`, 'system');
    },
    version: '1.0.0',
    author: 'Exemple'
};

const calc = {
    name: 'calc',
    description: 'Calculatrice simple',
    usage: 'calc <opération>',
    execute: function(args) {
        if (args.length === 0) {
            this.addOutput('Usage: calc <opération> (ex: calc 2+2)', 'error');
            return;
        }
        
        try {
            const expression = args.join(' ');
            // Sécurité basique: seulement chiffres et opérateurs
            if (!/^[\d\+\-\*\/\(\)\s\.]+$/.test(expression)) {
                this.addOutput('Erreur: Expression non valide (seuls les chiffres et +, -, *, /, (, ) sont autorisés)', 'error');
                return;
            }
            
            const result = eval(expression);
            this.addOutput(`
                <div class="bg-green-900/30 border border-green-600 rounded-lg p-3 my-2">
                    <div class="text-green-400 font-bold">Calculatrice</div>
                    <div class="text-white font-mono">${expression} = ${result}</div>
                </div>
            `, 'system');
        } catch (error) {
            this.addOutput(`Erreur de calcul: ${error.message}`, 'error');
        }
    }
};

const random = {
    name: 'random',
    description: 'Génère un nombre aléatoire',
    usage: 'random [min] [max]',
    execute: function(args) {
        let min = 1;
        let max = 100;
        
        if (args.length >= 1) {
            min = parseInt(args[0]);
            if (isNaN(min)) {
                this.addOutput('Erreur: Le minimum doit être un nombre', 'error');
                return;
            }
        }
        
        if (args.length >= 2) {
            max = parseInt(args[1]);
            if (isNaN(max)) {
                this.addOutput('Erreur: Le maximum doit être un nombre', 'error');
                return;
            }
        }
        
        if (min > max) {
            this.addOutput('Erreur: Le minimum ne peut pas être supérieur au maximum', 'error');
            return;
        }
        
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        this.addOutput(`
            <div class="bg-blue-900/30 border border-blue-600 rounded-lg p-3 my-2">
                <div class="text-blue-400 font-bold">Générateur aléatoire</div>
                <div class="text-white">Plage: ${min} - ${max}</div>
                <div class="text-yellow-300 font-mono text-lg">Résultat: ${randomNum}</div>
            </div>
        `, 'system');
    }
};

module.exports = {
    greet,
    calc,
    random
};
