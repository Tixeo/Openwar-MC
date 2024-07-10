const http = require('http');
const fs = require('fs');
const path = require('path');
const { main } = require('./stats');
const { executeCommand, checkUsersFromJSON } = require('./rcon');
const https = require('https');
const mysql = require('mysql2/promise');
const { log } = require('console');
require('dotenv').config()


const hostname = 'localhost';
const port = 9999;

const connection = mysql.createPool({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'database'
});


const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    if (req.url === '/check-user') {
      handleCheckUser(req, res);
    } else if (req.url === '/check-key') {
      handleCheckKey(req, res);
    } else if (req.url === '/user-info') {
      await handleUserInfo(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  } else {
    serveStaticFiles(req, res);
  }
});

function handleCheckUser(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { username } = JSON.parse(body);

    // Requete API mojang
    const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
    https.get(url, async (apiRes) => {
      let data = '';
      
      apiRes.on('data', chunk => {
        data += chunk;
      });
      
      apiRes.on('end', async () => {
        if (apiRes.statusCode === 200) {
          const userProfile = JSON.parse(data);
          const uuidProfile = userProfile.id;
          const formattedUUID = formatUUIDWithDashes(uuidProfile);
    
          try {
            const rows = await handleUserExist(formattedUUID);
            let connectedUser;
    
            if (!rows || rows.length === 0) {
              connectedUser = false;
            } else {
              connectedUser = true;
            }
    
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ exists: true, profile: userProfile, connectedUser: connectedUser }));
          } catch (error) {
            console.error('Erreur lors de la vérification de l\'existence de l\'utilisateur :', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to verify user existence' }));
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ exists: false }));
        }
      });
    }).on('error', (e) => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to fetch user data' }));
    });
  });
}

async function handleUserExist(formattedUUID) {
  try {
    const query = `
            SELECT SUBSTRING_INDEX(name, '::', -1) AS uuid, CAST(SUBSTRING_INDEX(name, '::', 1) AS CHAR) AS variable, CAST(value AS UNSIGNED) AS value
            FROM openwar
            WHERE name LIKE '%${formattedUUID}%';
    `;
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des joueurs :', error.message);
    return [];
  }
}

async function getUserPermissions(formattedUUID) {
  try {
    const query = `
      SELECT permission
      FROM luckperms_user_permissions
      WHERE uuid = ?;
    `;
    const [rows] = await connection.query(query, [formattedUUID]);
    const permissions = rows.map(row => row.permission.toString().replace('groupe.', ''));
    
    const priority = ['default', 'mercenary', 'ghost', 'staff', 'mod', 'admin'];
    permissions.sort((a, b) => priority.indexOf(b) - priority.indexOf(a));
    if (!permissions) {
      permissions = 'default'
    }    
    return permissions[0] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions :', error.message);
    return null;
  }
}

async function handleUserInfo(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', async () => {
    try {
      const { UUID } = JSON.parse(body);
      const formattedUUID = formatUUIDWithDashes(UUID);

      const rows = await getPlayers(formattedUUID);
      const permission = await getUserPermissions(formattedUUID);

      if (rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ exists: false }));
        return;
      }

      const result = processRows(rows);
      let levelsPerso = result.levelsPerso;
      let killsPerso = result.killsPerso;
      let deathsPerso = result.deathsPerso;
      let pertePerso = result.pertePerso;
      let gainPerso = result.gainPerso;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ exists: true, levelsPerso, killsPerso, deathsPerso, pertePerso, gainPerso, permission }));
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });
}

//async function handleGiveMercenary(req, res) {
//  let body = '';
//  req.on('data', chunk => {
//    body += chunk.toString();
//  });
//  req.on('end', async () => {
//    try {
//      const { UUID } = JSON.parse(body);
//      const formattedUUID = formatUUIDWithDashes(UUID);
//      console.log(`${formattedUUID} a recu grade mercenary`);
//
//      const query = `
//        INSERT INTO luckperms_user_permissions (uuid, permission) 
//        VALUES (?, 'groupe.mercenary');
//      `;
//      await connection.query(query, [formattedUUID]);
//
//      res.writeHead(200, { 'Content-Type': 'application/json' });
//      res.end(JSON.stringify({ success: true }));
//    } catch (error) {
//      console.error('Erreur lors de l\'insertion dans la base de données :', error.message);
//      res.writeHead(500, { 'Content-Type': 'application/json' });
//      res.end(JSON.stringify({ error: 'Internal Server Error' }));
//    }
//  });
//}
//
//async function handleGiveGhost(req, res) {
//  let body = '';
//  req.on('data', chunk => {
//    body += chunk.toString();
//  });
//  req.on('end', async () => {
//    try {
//      const { UUID } = JSON.parse(body);
//      const formattedUUID = formatUUIDWithDashes(UUID);
//      console.log(`${formattedUUID} a recu grade ghost`);
//
//      const query = `
//        INSERT INTO luckperms_user_permissions (uuid, permission) 
//        VALUES (?, 'groupe.ghost');
//      `;
//      await connection.query(query, [formattedUUID]);
//
//      res.writeHead(200, { 'Content-Type': 'application/json' });
//      res.end(JSON.stringify({ success: true }));
//    } catch (error) {
//      console.error('Erreur lors de l\'insertion dans la base de données :', error.message);
//      res.writeHead(500, { 'Content-Type': 'application/json' });
//      res.end(JSON.stringify({ error: 'Internal Server Error' }));
//    }
//  });
//}


function serveStaticFiles(req, res) {
  let filePath = path.join(__dirname, 'src', req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'src', '404.html'), (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

async function getPlayers(formattedUUID) {
  try {
    const query = `
      SELECT *
      FROM openwar
      WHERE name LIKE '%${formattedUUID}%';
    `;
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error('Erreur de récup des joueurs :', error.message);
    return [];
  }
}

function formatUUIDWithDashes(UUID) {
  return `${UUID.substr(0, 8)}-${UUID.substr(8, 4)}-${UUID.substr(12, 4)}-${UUID.substr(16, 4)}-${UUID.substr(20)}`;
}

function processRows(rows) {
  let levelsPerso, killsPerso, deathsPerso, pertePerso, gainPerso;

  rows.forEach(row => {
    let valueInBase10;

    if (row.value.length === 8) {
      valueInBase10 = Number(row.value.readBigUInt64BE(0));
    } else if (row.value.length <= 6) {
      valueInBase10 = row.value.readUIntBE(0, row.value.length);
    } else {
      valueInBase10 = parseInt(row.value.toString('hex'), 16);
    }

    switch (row.name.split('::')[0]) {
      case 'levels':
        levelsPerso = valueInBase10;
        break;
      case 'kills':
        killsPerso = valueInBase10;
        break;
      case 'deaths':
        deathsPerso = valueInBase10;
        break;
      case 'perte':
        pertePerso = valueInBase10;
        break;
      case 'gain':
        gainPerso = valueInBase10;
        break;
    }
  });

  return { levelsPerso, killsPerso, deathsPerso, pertePerso, gainPerso };
}

function handleCheckKey(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const { redeemCode, redeemUsername } = JSON.parse(body);
    const filePathMercenary = path.join(__dirname, 'key/keysMercenary.txt');
    const filePathGhost = path.join(__dirname, 'key/keysGhost.txt');
    const filePathGhostBox = path.join(__dirname, 'key/keysGhostBox.txt');
    const filePathMercenaryBox = path.join(__dirname, 'key/keysMercenaryBox.txt');
    const filePathAlreadyUsed = path.join(__dirname, 'key/alreadyUse.txt');

    try {
      let userUUID = null;
      let username = null;
      let item = null;
      try {
        userUUID = await usernameToUUID(redeemUsername);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ validUsername: false }));
        return;
      }

      const [dataMercenary, dataGhost, dataGhostBox, dataMercenaryBox, dataAlreadyUsed] = await Promise.all([
        fs.promises.readFile(filePathMercenary, 'utf-8'),
        fs.promises.readFile(filePathGhost, 'utf-8'),
        fs.promises.readFile(filePathGhostBox, 'utf-8'),
        fs.promises.readFile(filePathMercenaryBox, 'utf-8'),
        fs.promises.readFile(filePathAlreadyUsed, 'utf-8')
      ]);

      if (redeemCode.length !== 19) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: false, length: false, validUsername: true }));
        return;
      }

      if (dataAlreadyUsed.includes(redeemCode)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: false, alreadyUsed: true, validUsername: true }));
        return;
      }

      if (dataMercenary.includes(redeemCode, userUUID)) {
        const index = dataMercenary.indexOf(redeemCode);
        const newData = dataMercenary.slice(0, index) + dataMercenary.slice(index + redeemCode.length + 2);
        await fs.promises.writeFile(filePathMercenary, newData, 'utf-8');
        await fs.promises.appendFile(filePathAlreadyUsed, redeemCode + '\n', 'utf-8');
        const query = `
          INSERT INTO luckperms_user_permissions (uuid, permission) 
          VALUES (?, 'groupe.mercenary');
        `;
        await connection.query(query, [userUUID]);
        console.log(`${userUUID} a recu grade mercenary`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: true, length: true, fileFound: 'Mercenary rank', validUsername: true }));
      } else if (dataGhost.includes(redeemCode)) {
        const index = dataGhost.indexOf(redeemCode);
        const newData = dataGhost.slice(0, index) + dataGhost.slice(index + redeemCode.length + 2);
        await fs.promises.writeFile(filePathGhost, newData, 'utf-8');
        await fs.promises.appendFile(filePathAlreadyUsed, redeemCode + '\n', 'utf-8');
        const query = `
          INSERT INTO luckperms_user_permissions (uuid, permission) 
          VALUES (?, 'groupe.ghost');
        `;
        await connection.query(query, [userUUID]);
        console.log(`${userUUID} a recu grade ghost`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: true, length: true, fileFound: 'Ghost rank', validUsername: true }));
      } else if (dataGhostBox.includes(redeemCode)) {
        const index = dataGhostBox.indexOf(redeemCode);
        const newData = dataGhostBox.slice(0, index) + dataGhostBox.slice(index + redeemCode.length + 2);
        await fs.promises.writeFile(filePathGhostBox, newData, 'utf-8');
        await fs.promises.appendFile(filePathAlreadyUsed, redeemCode + '\n', 'utf-8');
        let username = redeemUsername;
        let item = 'elytra';
        executeCommand(username, item);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: true, length: true, fileFound: 'Ghost key', validUsername: true }));
      } else if (dataMercenaryBox.includes(redeemCode)) {
        const index = dataMercenaryBox.indexOf(redeemCode);
        const newData = dataMercenaryBox.slice(0, index) + dataMercenaryBox.slice(index + redeemCode.length + 2);
        await fs.promises.writeFile(filePathMercenaryBox, newData, 'utf-8');
        await fs.promises.appendFile(filePathAlreadyUsed, redeemCode + '\n', 'utf-8');
        let username = redeemUsername;
        let item = 'dirt';
        executeCommand(username, item);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: true, length: true, fileFound: 'Mercenary key', validUsername: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: false, length: true, validUsername: true }));
      }
      
    } catch (err) {
      console.error('Error reading/writing files', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }
  });
}



function usernameToUUID(username) {
  return new Promise((resolve, reject) => {
      const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
      https.get(url, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => {
              data += chunk;
          });
          apiRes.on('end', () => {
              if (apiRes.statusCode === 200) {
                  const userProfile = JSON.parse(data);
                  const uuidProfile = userProfile.id;
                  const formattedUUID = formatUUIDWithDashes(uuidProfile);
                  resolve(formattedUUID);
              } else {
                  reject('feur');
              }
          });
      }).on('error', (error) => {
          reject(new Error(`Erreur lors de la requête : ${error.message}`));
      });
  });
}








server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

setInterval(() => {
  main().catch(console.error);
}, 12000);
