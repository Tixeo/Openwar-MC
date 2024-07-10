const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'username',
    password: 'password',
    database: 'databse'
});

const permissionPriority = {
    'default': 0,
    'mercenary': 1,
    'ghost': 2,
    'staff': 3,
    'mod': 4,
    'admin': 5
};

async function getAllPlayers() {
    try {
        const query = `
            SELECT SUBSTRING_INDEX(name, '::', -1) AS uuid, CAST(SUBSTRING_INDEX(name, '::', 1) AS CHAR) AS variable, CAST(value AS UNSIGNED) AS value
            FROM openwar
            WHERE name LIKE 'levels::%';
        `;
        const [rows] = await connection.query(query);
        return rows;
    } catch (error) {
        console.error('Erreur lors de la récupération des joueurs :', error.message);
        return [];
    }
}

async function getUsernameFromUUID(uuid) {
    try {
        const url = `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`;
        const response = await axios.get(url);
        return response.data.name;
    } catch (error) {
        console.error(`Erreur lors de la récupération du nom d'utilisateur pour l'UUID ${uuid} : ${error.message}`);
        return null;
    }
}

async function fetchStatsForPlayer(uuid, username) {
    const variables = ['levels', 'kills', 'deaths', 'perte', 'gain'];
    const stats = {};

    for (const variable of variables) {
        try {
            let result;
            if (variable === 'perte' || variable === 'gain') {
                [result] = await connection.query(`SELECT value FROM openwar WHERE name = ?`, [`${variable}::${username}`]);
            } else {
                [result] = await connection.query(`SELECT value FROM openwar WHERE name = ?`, [`${variable}::${uuid}`]);
            }
            stats[variable] = result.length > 0 ? parseInt(result[0].value.toString('hex'), 16) : 0;
        } catch (error) {
            console.error(`Erreur lors de la récupération des ${variable} pour ${variable === 'perte' || variable === 'gain' ? 'le pseudo' : 'l\'UUID'} ${variable === 'perte' || variable === 'gain' ? username : uuid} : ${error.message}`);
            stats[variable] = 0;
        }
    }
    return stats;
}

async function getPermissionForPlayer(uuid) {
    try {
        const query = `
            SELECT permission
            FROM luckperms_user_permissions
            WHERE uuid = ?;
        `;
        const [rows] = await connection.query(query, [uuid]);

        if (rows.length === 0) {
            return 'default';
        }

        // permissions
        rows.sort((a, b) => permissionPriority[b.permission.split('.')[1]] - permissionPriority[a.permission.split('.')[1]]);
        return rows[0].permission.split('.')[1];
    } catch (error) {
        console.error(`Erreur lors de la récupération des permissions pour l'UUID ${uuid} : ${error.message}`);
        return 'default';
    }
}

async function main() {
    const allPlayers = await getAllPlayers();
    const playerData = [];
    
    for (const player of allPlayers) {
        const { uuid, value: levels } = player;
        const username = await getUsernameFromUUID(uuid);
        const stats = await fetchStatsForPlayer(uuid, username);
        const permission = await getPermissionForPlayer(uuid);

        playerData.push({
            name: username,
            uuid: uuid,
            level: stats.levels,
            kills: stats.kills,
            deaths: stats.deaths,
            casinoPerte: stats.perte,
            casinoGain: stats.gain,
            permission: permission
        });
    }

    // filtre
    playerData.sort((a, b) => b.level - a.level);

    const top10Players = playerData.slice(0, 10);

    const secondPlayer = top10Players.splice(1, 1)[0];
    top10Players.unshift(secondPlayer);

    const temp = top10Players[0];
    top10Players[0] = top10Players[2];
    top10Players[2] = temp;

    const finalPlayerData = top10Players.map((player, index) => {
        if (index < 3) {
            return {
                ...player,
                skinURL: `https://mc-heads.net/body/${player.uuid}/right`
            };
        } else {
            return {
                ...player,
                headURL: `https://minotar.net/avatar/${player.uuid}`
            };
        }
    });

    fs.writeFileSync('src/public/json/playerData.json', JSON.stringify(finalPlayerData, null, 2));
    console.log('data created');
}

module.exports = { main };
