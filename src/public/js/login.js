//login modal fermeture
const loginButton = document.getElementById('checkUserButton')
const redeemButton = document.getElementById('receiveProductButton')
document.addEventListener('keydown', function (event) {
    if (event.keyCode === 13) {
        loginButton.click();
    }
});
document.addEventListener('keydown', function (event) {
    if (event.keyCode === 13) {
        redeemButton.click();
    }
});












let userName = localStorage.getItem('username');
let UUID = localStorage.getItem('uuid');
console.log(userName);
console.log(UUID);

const HeaderImg = document.getElementById('cennected?HeaderImg')
const HeaderValue = document.getElementById('cennected?HeaderValue')
const redirectionId = document.getElementsByClassName('cennected?HeaderRedirectionId')
const redirectionHref = document.getElementById('cennected?HeaderRedirectionHref')


//connected? variable
try {
    if (!userName) {
        HeaderImg.src = `public/icons/useradd-icon.svg`
        HeaderValue.textContent = `Connection`
        //redirectionId.id = `openConnexionModal`,
        //redirectionHref.setAttribute('href', '')
    } else {
        //redirectionHref.setAttribute('href', '#account')
        //redirectionId.id = ``,
        HeaderImg.style.width = '30px'
        HeaderImg.style.height = '30px'
        HeaderImg.style.borderRadius = '5px'
        HeaderImg.src = `https://minotar.net/avatar/${UUID}`
        HeaderValue.textContent = `${userName}`
    }
} catch (error) {
    console.log(`Erreur lors de la connection de l'utilisateur`)
}



document.addEventListener('DOMContentLoaded', () => {
    const initializeHeader = () => {
        const test = document.getElementById('textTest');
        const yourSkinImg = document.getElementById('connected?yourSkinImg')
        const yourName = document.getElementById('connected?yourName')
        const levelsPerso = document.getElementById('connected?levelsPerso')
        const killsPerso = document.getElementById('connected?killsPerso')
        const deathsPerso = document.getElementById('connected?deathsPerso')
        const pertePerso = document.getElementById('connected?pertePerso')
        const gainPerso = document.getElementById('connected?gainPerso')
        const playerRank = document.getElementById('connected?playerRank')


        try {
            if (!test) {
                return false;
            }
            if (!username) {
                yourName.textContent = `Error`
                yourSkinImg.textContent = `https://mc-heads.net/body/MHF_Steve/right`;
                levelsPerso.textContent = `Error`
                killsPerso.textContent = `Error`
                deathsPerso.textContent = `Error`
                pertePerso.textContent = `Error`
                gainPerso.textContent = `Error`
                playerRank.textContent = `Error`
            } else {
                levelsPerso.textContent = sessionStorage.getItem("levelsPerso");
                killsPerso.textContent = sessionStorage.getItem("killsPerso");
                deathsPerso.textContent = sessionStorage.getItem("deathsPerso");
                pertePerso.textContent = sessionStorage.getItem("pertePerso");
                gainPerso.textContent = sessionStorage.getItem("gainPerso");
                yourName.textContent = `${userName}`
                yourSkinImg.src = `https://mc-heads.net/body/${UUID}/right`;
                if (sessionStorage.getItem("playerRank") === 'default') {
                    playerRank.style.display = 'none'
                } else {
                    playerRank.style.display = 'flex'
                    playerRank.textContent = sessionStorage.getItem("playerRank").toUpperCase();
                };
            }
            return true;
        } catch (error) {
            console.log(`Erreur lors de la connection de l'utilisateur`);
            return false;
        }
    };

    if (!initializeHeader()) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                if (initializeHeader()) {
                    observer.disconnect();
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
    window.initializeHeader = initializeHeader;
});




//localStorage.removeItem('username');
//localStorage.clear();









document.addEventListener('DOMContentLoaded', () => {
    const checkButtonExistence = () => {
        const deconnexionButton = document.getElementById('deconnexionButton');
        if (deconnexionButton) {
            deconnexionButton.addEventListener('click', () => {
                const username = localStorage.getItem('username');
                if (!username) {
                    console.log("You aren't connected");
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('uuid');
                    location.reload();
                }
            });
            return true;
        }
        return false;
    };

    const initializeObserver = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                checkButtonExistence();
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    if (!checkButtonExistence()) {
        initializeObserver();
    }

    const fetchUserInfo = () => {
        const userName = localStorage.getItem('username');
        if (window.location.hash === '#account' && userName) {
            let UUID = localStorage.getItem('uuid');
            fetch('/user-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ UUID })
            })
            .then(response => response.json())
            .then(data => {
                console.log('User Info Response:', data);
                if (data.exists) {
                    console.log('Levels Perso:', data.levelsPerso);
                    sessionStorage.setItem("levelsPerso", data.levelsPerso);
                    sessionStorage.setItem("killsPerso", data.killsPerso);
                    sessionStorage.setItem("deathsPerso", data.deathsPerso);
                    sessionStorage.setItem("pertePerso", data.pertePerso);
                    sessionStorage.setItem("gainPerso", data.gainPerso);
                } else {
                    console.log('User info not found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    };

    fetchUserInfo();

    window.addEventListener('hashchange', fetchUserInfo);
});














//connexion
document.getElementById('checkUserButton').addEventListener('click', () => {
    const username = document.getElementById('username').value;

    fetch('/check-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    })
        .then(response => response.json())
        .then(data => {
            const resultElement = document.getElementById('result');
            if (!username) {
                resultElement.textContent = `Please enter a username.`;
            } else if (data.exists && !data.connectedUser) {
                resultElement.textContent = `This user never joined the server.`;
            } else if (data.exists && data.connectedUser) {
                resultElement.textContent = ``;
                localStorage.setItem('username', `${data.profile.name}`);
                localStorage.setItem('uuid', `${data.profile.id}`);
                location.reload()
            } else {
                resultElement.textContent = `This user doesn't exist.`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').textContent = 'An error occurred';
        });
});


//deconnexion
document.addEventListener('DOMContentLoaded', () => {
    const checkButtonExistence = () => {
        const deconnexionButton = document.getElementById('deconnexionButton');
        if (deconnexionButton) {
            deconnexionButton.addEventListener('click', () => {
                const username = localStorage.getItem('username');
                if (!username) {
                    console.log("You aren't connected");
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('uuid');
                    localStorage.removeItem('playerRank')
                    location.reload();
                }
            });
            return true;
        }
        return false;
    };

    const initializeObserver = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                checkButtonExistence();
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    if (!checkButtonExistence()) {
        initializeObserver();
    }

    const fetchUserInfo = () => {
        const userName = localStorage.getItem('username');
        if (window.location.hash === '#account' && userName) {
            let UUID = localStorage.getItem('uuid');
            fetch('/user-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ UUID, userName })
            })
            .then(response => response.json())
            .then(data => {
                console.log('User Info Response:', data);
                if (data.exists) {
                    console.log('Levels Perso:', data.levelsPerso);
                    sessionStorage.setItem("levelsPerso", data.levelsPerso);
                    sessionStorage.setItem("killsPerso", data.killsPerso);
                    sessionStorage.setItem("deathsPerso", data.deathsPerso);
                    sessionStorage.setItem("pertePerso", data.pertePerso);
                    sessionStorage.setItem("gainPerso", data.gainPerso);
                    sessionStorage.setItem("playerRank", data.permission);
                } else {
                    console.log('User info not found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    };

    fetchUserInfo();
    window.addEventListener('hashchange', fetchUserInfo);
});









//redeem Code
document.getElementById('receiveProductButton').addEventListener('click', () => {
    const redeemCode = document.getElementById('redeemcode').value;
    const redeemUsername = document.getElementById('redeemcodeUsername').value;

    fetch('/check-key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ redeemCode, redeemUsername })
    })
        .then(response => response.json())
        .then(data => {
            if (data.alreadyUsed) {
                document.getElementById('resultRedeem').textContent = `The code is invalid. It has already been used`;
            } else if (!data.message && !data.length && data.validUsername) {
                document.getElementById('resultRedeem').textContent = `The code is invalid. It does not contain the right number of characters.`;
            } else if (data.message && data.length && data.validUsername) {
                document.getElementById('resultRedeem').textContent = `The code is valid! You will receive your ${data.fileFound} shortly.`;
            } else if (!data.validUsername) {
                document.getElementById('resultRedeem').textContent = `This user does not exist`;
            } else {
                document.getElementById('resultRedeem').textContent = `The code is not valid. Please try again.`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').textContent = 'An error occurred';
        });
});
