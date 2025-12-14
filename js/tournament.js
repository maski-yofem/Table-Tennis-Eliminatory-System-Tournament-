// Global variable to track the current state of the tournament.
let currentBracket = [];
let totalRounds = 0;

document.addEventListener('DOMContentLoaded', () => {
    const playersJSON = localStorage.getItem('shuffledPlayers');

    if (!playersJSON) {
        document.getElementById('bracket-container').innerHTML =
            '<h2>Erro: Dados dos jogadores não encontrados. Por favor, inicie o torneio novamente a partir da página de jogadores.</h2>';
        return;
    }

    let initialPlayers = JSON.parse(playersJSON);
    console.log("Jogadores recuperados do localStorage (BYEs inclusos):", initialPlayers);

    buildBracket(initialPlayers);

    setupInitialRoundClicks();
});


// =======================================================
// FUNCTION 5: BUILD BRACKET (VISUAL ASSEMBLY)
// =======================================================

// It builds the visual structure of the keys in HTML.

function buildBracket(players) {
    const container = document.getElementById('bracket-container');
    container.innerHTML = '';

    const numPlayers = players.length;
    totalRounds = Math.log2(numPlayers);

    let playersInRound = numPlayers;
    let roundIndex = 1;
    let roundHTML = '';

    while (playersInRound > 1) {
        let matchesInRound = playersInRound / 2;
        let roundDiv = `<div class="round round-${roundIndex}">`;

        if (roundIndex === 1) {
            for (let i = 0; i < matchesInRound; i++) {
                const player1 = players[i * 2];
                const player2 = players[i * 2 + 1];

                const matchID = `R${roundIndex}M${i + 1}`;
                const isByeMatch = player1 === "BYE" || player2 === "BYE";

                roundDiv += createMatchHTML(matchID, player1, player2, roundIndex, isByeMatch);

                // RULES R1: ONLY HERE IS ADVANCEMENT AUTOMATIC
                if (isByeMatch) {
                    let winner;
                    if (player1 === "BYE" && player2 === "BYE") {
                        // BYE vs BYE advances "BYE" itself
                        winner = "BYE";
                    } else {
                        // Player vs BYE advances the player
                        winner = (player1 === "BYE") ? player2 : player1;
                    }
                    // Call advanceWinner to move the winner (either player or "BYE") to the next round.
                    setTimeout(() => advanceWinner(matchID, winner), 500);
                }
            }
        } else {
            for (let i = 0; i < matchesInRound; i++) {
                const matchID = `R${roundIndex}M${i + 1}`;
                // Future rounds are constructed with '?'
                roundDiv += createMatchHTML(matchID, '?', '?', roundIndex, false);
            }
        }

        roundDiv += '</div>';
        roundHTML += roundDiv;

        playersInRound /= 2;
        roundIndex++;
    }

    container.innerHTML = roundHTML;
}


// Creates the HTML structure for a single match.

function createMatchHTML(matchID, player1, player2, roundIndex, isByeMatch) {
    // Adds a class for selection (only for Round 1 players who are not BYE)
    const player1Class = (roundIndex === 1 && player1 !== 'BYE') ? 'clickable-initial' : '';
    const player2Class = (roundIndex === 1 && player2 !== 'BYE') ? 'clickable-initial' : '';

    return `
        <div class="match ${isByeMatch ? 'bye-match' : ''}" data-match-id="${matchID}" data-round="${roundIndex}">
            <div class="player player-top ${player1Class}" data-player-name="${player1}" data-match-target="${matchID}">
                <span class="player-name">${player1}</span>
            </div>
            <div class="player player-bottom ${player2Class}" data-player-name="${player2}" data-match-target="${matchID}">
                <span class="player-name">${player2}</span>
            </div>
            ${isByeMatch ? '<span class="bye-label">R1 AUTO-ADVANCE</span>' : ''}
            <div class="match-line"></div>
        </div>
    `;
}

// BIND CLICKS FOR THE INITIAL ROUND

function setupInitialRoundClicks() {
    const initialPlayers = document.querySelectorAll('.player.clickable-initial');

    initialPlayers.forEach(playerDiv => {
        playerDiv.onclick = function () {
            const matchID = this.dataset.matchTarget;
            const winnerName = this.dataset.playerName;
            registerWinner(matchID, winnerName);
        };
    });
}


// =======================================================
// FUNCTION 6: REGISTER WINNER (INTERACTION)
// =======================================================
function registerWinner(matchID, winnerName) {

    // If the user clicks on a "BYE" or empty slot, the click is ignored.
    if (winnerName === "BYE" || winnerName === "?") {
        console.warn(`Tentativa de registrar ${winnerName} como vencedor. Ação bloqueada.`);
        return;
    }

    advanceWinner(matchID, winnerName);
}

function advanceWinner(matchID, winnerName) {
    const matchElement = document.querySelector(`[data-match-id="${matchID}"]`);
    const roundIndex = parseInt(matchElement.dataset.round);
    const players = matchElement.querySelectorAll('.player');

    // 1. Update the current match's appearance (highlight winner, disable)
    players.forEach(playerDiv => {
        if (playerDiv.dataset.playerName === winnerName) {
            playerDiv.classList.add('winner');
        } else {
            // Ensures the losing slot is marked, unless it's a '?' or 'BYE'.
            if (playerDiv.dataset.playerName !== '?' && playerDiv.dataset.playerName !== 'BYE') {
                playerDiv.classList.add('loser');
            } else if (playerDiv.dataset.playerName === 'BYE') {
                // If the loser is BYE, mark BYE as 'loser'
                playerDiv.classList.add('loser');
            }
        }
        // Disables clicking on the current match.
        playerDiv.onclick = null;
    });

    // 2. If it is the last round (Final), the champion is declared.
    if (roundIndex === totalRounds) {
        displayChampion(winnerName);
        return;
    }

    // 3. Calculate the ID of the next match.
    const currentMatchNumber = parseInt(matchID.match(/M(\d+)/)[1]);
    const nextRoundIndex = roundIndex + 1;
    const nextMatchNumber = Math.ceil(currentMatchNumber / 2);
    const nextMatchID = `R${nextRoundIndex}M${nextMatchNumber}`;

    // 4. Promote the winner to the next match.
    const nextMatchElement = document.querySelector(`[data-match-id="${nextMatchID}"]`);

    if (nextMatchElement) {

        const topSlot = nextMatchElement.querySelector('.player-top');
        const bottomSlot = nextMatchElement.querySelector('.player-bottom');

        // Determines which slot needs to be filled.
        const targetSlot = (currentMatchNumber % 2 !== 0) ? topSlot : bottomSlot;

        // Update the slot with the winner's name.
        targetSlot.dataset.playerName = winnerName;
        targetSlot.querySelector('.player-name').textContent = winnerName;

        // Ensures that the newly filled slot is not clickable.
        targetSlot.onclick = null;

        
        // CORRECTION LOGIC (BYE vs BYE AUTO-ADVANCE in R2+)

        const topName = topSlot.dataset.playerName;
        const bottomName = bottomSlot.dataset.playerName;

        if (topName === 'BYE' && bottomName === 'BYE') {
            console.warn(`[R2+ Auto-Advance] BYE vs BYE detectado em ${nextMatchID}. Avançando um BYE.`);
            // Call the function to advance the BYE and THEN RETURN.
            setTimeout(() => advanceWinner(nextMatchID, 'BYE'), 100);
            return; // <<-- ESSENTIAL: Stops processing for this match.
        }
        
        // 5. Next Match Clickability Control
       

        // Generic click function for the next match.
        const matchClickHandler = function () {
            registerWinner(nextMatchID, this.dataset.playerName);
        };

        // The match becomes clickable only if BOTH slots are filled (not marked with '?').
        if (topName !== '?' && bottomName !== '?') {

            console.log(`Match ${nextMatchID} ready! (R2+ logic)`);

            // Allows click on both, but registerWinner will block click on "BYE"
            // Note: If one is 'BYE' and the other is a Player, only the Player is truly clickable due to registerWinner.
            topSlot.onclick = matchClickHandler;
            bottomSlot.onclick = matchClickHandler;

        } else {
            // Incomplete match, ensures that clicks are disabled.
            topSlot.onclick = null;
            bottomSlot.onclick = null;
        }
    }
}

// =======================================================
// FUNCTION 7: DISPLAY CHAMPION
// =======================================================

function displayChampion(championName) {
    document.getElementById('bracket-container').innerHTML =
        `<div class="champion-display-final">
            <h1>🏆 CAMPEÃO 🏆</h1>
            <h2>${championName}</h2>
            <button onclick="resetTournament()">Iniciar Novo Torneio</button>
        </div>`;
}

function resetTournament() {
    localStorage.removeItem('shuffledPlayers');
    window.location.href = '../index.html';
}