const { Rcon } = require('rcon-client');
const fs = require('fs');
const path = require('path');

async function executeCommand(username, item) {
    const rcon = new Rcon({
        host: 'localhost',
        port: 25575,
        password: 'password'
    });
    try {
        await rcon.connect();
        const response = await rcon.send('list');
        const players = parsePlayersList(response);
        if (players.includes(username)) {
            try {
                await rcon.send(`give ${username} ${item}`);
            } catch (err) {
                console.error('Erreur:', err);
            } finally {
                rcon.end();
            }
        } else {
            addToJSONFile(username, item);
            rcon.end();
        }
    } catch (err) {
        console.error('Erreur:', err);
    }
}

async function checkUsersFromJSON() {
    const filePath = path.join(__dirname, 'key/players.json');
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            console.error('Erreur de lecture du fichier JSON:', err);
            return;
        }
        
        let json;
        try {
            json = JSON.parse(data);
        } catch (parseErr) {
            console.error('Erreur de parsing du fichier JSON:', parseErr);
            return;
        }

        const rcon = new Rcon({
            host: 'localhost',
            port: 25575,
            password: 'tixe0'
        });

        try {
            await rcon.connect();
            const response = await rcon.send('list');
            const players = parsePlayersList(response);

            let remainingUsers = [];

            for (const { username, item } of json.users) {
                if (players.includes(username)) {
                    try {
                        await rcon.send(`give ${username} ${item}`);
                    } catch (err) {
                        console.error('Erreur:', err);
                        remainingUsers.push({ username, item });
                    }
                } else {
                    remainingUsers.push({ username, item });
                }
            }

            fs.writeFile(filePath, JSON.stringify({ users: remainingUsers }, null, 2), 'utf8', writeErr => {
                if (writeErr) {
                    console.error('Erreur d\'écriture dans le fichier JSON:', writeErr);
                } else {
                    console.log('Fichier JSON mis à jour');
                }
            });
        } catch (err) {
            console.error('Erreur de connexion RCON:', err);
        } finally {
            rcon.end();
        }
    });
}




function parsePlayersList(response) {
    const match = response.match(/There are \d+ of a max of \d+ players online: (.*)/);
    if (match) {
        return match[1].split(', ').filter(player => player !== '');
    }
    return [];
}

function addToJSONFile(username, item) {
    const filePath = path.join(__dirname, 'key/players.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error :', err);
            return;
        }
        
        let json;
        if (data) {
            try {
                json = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error :', parseErr);
                return;
            }
        } else {
            json = { users: [] };
        }

        json.users.push({ username, item });

        fs.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8', writeErr => {
            if (writeErr) {
                console.error(`Erreur d'ajout du joueur dans le json:`, writeErr);
            }
        });
    });
}

module.exports = { executeCommand, checkUsersFromJSON };