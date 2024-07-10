document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content');
    const pages = ['home', 'shop', 'stats', 'account', 'map'];
    const pageContents = {};

    for (const page of pages) {
        const response = await fetch(`./${page}.html`);
        pageContents[page] = await response.text();
    }

    const showPage = (page) => {
        if (pageContents[page]) {
            fadeOutContent(() => {
                contentDiv.innerHTML = pageContents[page];
                setupModal();
                if (page === 'stats') {
                    setupStatistics();
                }
                fadeInContent();
            });
        } else {
            fadeOutContent(() => {
                contentDiv.innerHTML = '<div id="nofound" title="404">404</div>';
                fadeInContent();
            });
        }
        updateActiveButton(page);
    };

    function fadeOutContent(callback) {
        contentDiv.classList.remove('fade-in');
        setTimeout(callback, 200); 
    }

    function fadeInContent() {
        setTimeout(() => contentDiv.classList.add('fade-in'), 10);
    }

    function updateActiveButton(activePage) {
        document.querySelectorAll('header a').forEach(link => {
            const page = link.getAttribute('data-page');
            const button = link.querySelector('button');
            if (page === activePage) {
                button.className = 'actual_button';
            } else {
                button.className = '';
            }
        });
    }

    function setupModal() {
        const downloadModal = document.getElementById("downloadModal");
        const openDownloadBtn = document.getElementById("openDownloadModal");
        const closeDownloadBtn = document.getElementById("closeDownloadModal");

        if (openDownloadBtn) {
            openDownloadBtn.onclick = function() {
                downloadModal.style.display = "flex";
            }
        }

        if (closeDownloadBtn) {
            closeDownloadBtn.onclick = function() {
                downloadModal.style.display = "none";
            }
        }

        const voteModal = document.getElementById("voteModal");
        const openVoteBtn = document.getElementById("openVoteModal");
        const closeVoteBtn = document.getElementById("closeVoteModal");

        if (openVoteBtn) {
            openVoteBtn.onclick = function() {
                voteModal.style.display = "flex";
            }
        }

        if (closeVoteBtn) {
            closeVoteBtn.onclick = function() {
                voteModal.style.display = "none";
            }
        }


        const codeModal = document.getElementById("codeModal");
        const openCodeBtn = document.getElementById("openCodeModal");
        const closeCodeBtn = document.getElementById("closeCodeModal");

        if (openCodeBtn) {
            openCodeBtn.onclick = function() {
                codeModal.style.display = "flex";
            }
        }

        if (closeCodeBtn) {
            closeCodeBtn.onclick = function() {
                codeModal.style.display = "none";
            }
        }

        const connexionModal = document.getElementById("connexionModal");
        const openConnexionBtn = document.getElementById("openConnexionModal");
        const closeConnexionBtn = document.getElementById("closeConnexionModal");
        
        if (openConnexionBtn && !userName) {
            openConnexionBtn.onclick = function() {
                connexionModal.style.display = "flex";
            }
            if (window.location.hash === '#account') {
                window.location.hash = 'home';
            }
        } else if (openConnexionBtn && userName) {
            openConnexionBtn.onclick = function() {
                window.location.hash = 'account'; //bug
            }
            if (window.location.hash === '#account') {
                openConnexionBtn.className = 'actual_button'
            }else {
                openConnexionBtn.className = ''
            }
        }


        if (closeConnexionBtn) {
            closeConnexionBtn.onclick = function() {
                connexionModal.style.display = "none";
            }
        }

        const mercenaryModal = document.getElementById("mercenaryModal");
        const openMercenaryBtn = document.getElementById("openMercenaryModal");
        const closeMercenaryBtn = document.getElementById("closeMercenaryModal");

        if (openMercenaryBtn) {
            openMercenaryBtn.onclick = function() {
                mercenaryModal.style.display = "flex";
            }
        }

        if (closeMercenaryBtn) {
            closeMercenaryBtn.onclick = function() {
                mercenaryModal.style.display = "none";
            }
        }

        const ghostModal = document.getElementById("ghostModal");
        const openGhostBtn = document.getElementById("openGhostModal");
        const closeGhostBtn = document.getElementById("closeGhostModal");

        if (openGhostBtn) {
            openGhostBtn.onclick = function() {
                ghostModal.style.display = "flex";
            }
        }

        if (closeGhostBtn) {
            closeGhostBtn.onclick = function() {
                ghostModal.style.display = "none";
            }
        }

        window.onclick = function(event) {
            if (event.target == downloadModal) {
                downloadModal.style.display = "none";
            }
            if (event.target == voteModal) {
                voteModal.style.display = "none";
            }
            if (event.target == connexionModal) {
                connexionModal.style.display = "none";
            }
            if (event.target == mercenaryModal) {
                mercenaryModal.style.display = "none";
            }
            if (event.target == ghostModal) {
                ghostModal.style.display = "none";
            }
            if (event.target == codeModal) {
                codeModal.style.display = "none";
            }
        }

        window.onkeydown = function(event) {
            if (event.key === "Escape") {
                if (downloadModal.style.display === "flex") {
                    downloadModal.style.display = "none";
                }
                if (voteModal.style.display === "flex") {
                    voteModal.style.display = "none";
                }
                if (connexionModal.style.display === "flex") {
                    connexionModal.style.display = "none";
                } 
                if (mercenaryModal.style.display === "flex") {
                    mercenaryModal.style.display = "none";
                } 
                if (ghostModal.style.display === "flex") {
                    ghostModal.style.display = "none";
                } 
                if (codeModal.style.display === "flex") {
                    codeModal.style.display = "none";
                } 
            }
        }
        initializeHeader();
    }

    function setupStatistics() {
        fetch('public/json/playerData.json')
            .then(response => response.json())
            .then(data => {
                const topPlayersDiv = document.getElementById('topPlayers');
                const topTen = document.getElementById('topTen');

                data.forEach((player, index) => {
                    const playerDiv = document.createElement('div');
                    playerDiv.className = player.skinURL ? `podium top${index + 1}` : `player`;

                    const skinImg = document.createElement('img');
                    skinImg.src = player.skinURL || player.headURL;
                    playerDiv.appendChild(skinImg);

                    const playerContainerDiv = document.createElement('div');
                    playerContainerDiv.className = 'playerContainer';
                    playerDiv.appendChild(playerContainerDiv);

                    const playerNameDiv = document.createElement('div');
                    playerNameDiv.className = 'username';
                    playerContainerDiv.appendChild(playerNameDiv);

                    const playerNameSpan = document.createElement('p');
                    if (player.permission === 'default') {
                        playerNameSpan.style.display = 'none'
                    } else if (player.permission === 'mod') {
                        playerNameSpan.style.display = 'flex'
                        playerNameSpan.textContent = 'MODO';
                    } else {
                        playerNameSpan.style.display = 'flex'
                        playerNameSpan.textContent = player.permission.toUpperCase();
                    }
                    playerNameDiv.appendChild(playerNameSpan);

                    const playerName = document.createElement('p');
                    playerName.textContent = player.name;
                    playerNameDiv.appendChild(playerName);

                    const textesDiv = document.createElement('div');
                    textesDiv.className = player.headURL ? 'textes10' : 'textes';
                    playerContainerDiv.appendChild(textesDiv);

                    const createTextElement = (label, value) => {
                        const texteDiv = document.createElement('div');
                        texteDiv.className = 'texte';

                        const labelP = document.createElement('p');
                        labelP.textContent = label;
                        texteDiv.appendChild(labelP);

                        const valueP = document.createElement('p');
                        valueP.textContent = value;
                        texteDiv.appendChild(valueP);

                        return texteDiv;
                    };

                    textesDiv.appendChild(createTextElement('level : ', player.level));
                    textesDiv.appendChild(createTextElement('kills : ', player.kills));
                    textesDiv.appendChild(createTextElement('deaths : ', player.deaths));
                    textesDiv.appendChild(createTextElement('casino losses : ', player.casinoPerte));
                    textesDiv.appendChild(createTextElement('casino winnings : ', player.casinoGain));

                    if (player.skinURL) {
                        topPlayersDiv.appendChild(playerDiv);
                    } else {
                        topTen.appendChild(playerDiv);
                    }
                });
            })
            .catch(error => console.error(error));
    }

    window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '');
        showPage(page);
    });

    if (window.location.hash) {
        showPage(window.location.hash.replace('#', ''));
    } else {
        window.location.hash = 'home';
    }

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = event.target.getAttribute('data-page');
            window.location.hash = page;
        });
    });

    setupModal();
});
