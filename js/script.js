// Global variable to store the players for tournament logic
let playersTournament = [];


// =======================================================
// FUNCTION 1: ADD PLAYER TO ARRAY AND VISUAL LIST
// =======================================================

function addPlayer() {
    const inputElement = document.getElementById('new-player');
    const name = inputElement.value.trim();

    if (name.length > 0) {
        // 1. Add the name to the Logic Array
        playersTournament.push(name);

        // 2. Reset the input
        inputElement.value = '';
        inputElement.focus();

        // 3. Render the list
        renderPlayersList();

        console.log(`Player added: ${name}. Total players: ${playersTournament.length}`);

    } else {
        alert("Please, insert a valid name.");
    }
};

// =======================================================
// FUNCTION 2: START TOURNAMENT LOGIC
// =======================================================

function initiateSwitching() {
    if (playersTournament.length < 2) {
        alert("Please insert at least 2 names to start the tournament.");
        return;
    }

    // 1. Create a copy to work with, avoiding modification of the original array
    let players = [...playersTournament];

    // 2. Adjust the number of players to the next power of 2 (BYE logic corrected)
    players = verifyNumberPlayers(players);

    // 3. Shuffle the players to randomize the bracket
    shuffle(players);

    console.log("--- TOURNAMENT PREPARED ---");
    console.log("Final number of slots (incl. BYE):", players.length);
    console.log("Shuffled Players (Bracket Order):", players);

    // 4. IMPORTANT: Save the shuffled array to Local Storage
    try {
        localStorage.setItem('shuffledPlayers', JSON.stringify(players));
    } catch (e) {
        console.error("Failed to save to localStorage:", e);
        alert("Could not start tournament due to an error saving player data.");
        return;
    }

    // 5. Redirect to the tournament page
    window.location.href = 'tournament.html';
};

// =======================================================
// FUNCTION 3: VERIFY AND ADJUST NUMBER OF PLAYERS (CORRIGIDA)
// =======================================================

/**
 * Ensures that the total number of participants (players + BYEs) is a power of 2.
 * @param {Array<string>} players - List of starting players.
 * @returns {Array<string>} Player roster adjusted for the next power of 2.
*/

function verifyNumberPlayers(players) {
    const numPlayers = players.length;
    let numSlots = 2;

    // 1. Find the next power of 2 (2, 4, 8, 16, etc.)
    while (numSlots < numPlayers) {
        numSlots *= 2;
    }

    const numByes = numSlots - numPlayers;

    if (numByes > 0) {
        // 2. Add the exact number of BYEs needed to reach the power of 2.
        for (let i = 0; i < numByes; i++) {
            players.push("BYE");
        }
        console.warn(`Ajuste necessário: ${numByes} "BYEs" adicionados para completar ${numSlots} slots.`);
    } else {
        console.log(`Número de jogadores (${numPlayers}) é potência de 2. Nenhum BYE adicionado.`);
    }

    return players;
};

// =======================================================
// FUNCTION 4: SHUFFLE (RANDOMIZE) PLAYERS
// =======================================================

/**
 * Shuffles the array randomly using the simple sort method.
 * @param {Array<string>} array - The array to be shuffled in-place.
*/

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
};

// =======================================================
// FUNCTION 5: TOTAL PLAYERS
// =======================================================

function totalPlayers() {
    const total = playersTournament.length;
    const totalElement = document.querySelector('.total-players');

    // Update the content of the <span>
    totalElement.textContent = `Total: ${total} ${total === 1 ? 'player' : 'players'}`;
}

// =======================================================
// FUNCTION 6: REMOVE PLAYER (Delete)
// =======================================================

/**
 * Remotes a player from the logical array and the visual list.
 * @param {number} index - The player's index in the playersTournament array.
*/

function removePlayer(index) {
    // 1. Remove from logical array
    const removedPlayer = playersTournament.splice(index, 1);
    console.log(`Player removed: ${removedPlayer[0]}. Total players: ${playersTournament.length}`);

    // 2. Re-render (rebuilds the list)
    renderPlayersList();
}

// =======================================================
// FUNCTION 7: RENDER LIST (Rebuild the visual list.)
// =======================================================

function renderPlayersList() {
    const visualList = document.getElementById('list-players-visual');
    visualList.innerHTML = '';

    playersTournament.forEach((name, index) => {
        const newLi = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        newLi.appendChild(nameSpan);

        const removeButton = document.createElement('button');
        removeButton.textContent = 'X';
        removeButton.classList.add('remove-player-btn');

        // Securely assign the click.
        removeButton.onclick = function () {
            removePlayer(index);
        };

        newLi.appendChild(removeButton);
        visualList.appendChild(newLi);
    });

    // 3. Update the total.
    totalPlayers();
}

// =======================================================
//ADD SUPPORT FOR THE ENTER KEY
// =======================================================

document.addEventListener('DOMContentLoaded', function () {
    // It is crucial that the 'new-player' is available in the DOM.
    const inputElement = document.getElementById('new-player');

    if (inputElement) {
        // Adds the 'keydown' (key pressed) event listener.
        inputElement.addEventListener('keydown', function (event) {
            // Check if the pressed key is "Enter".
            if (event.key === 'Enter') {
                // Prevents the default action of pressing Enter (such as submitting a form, if applicable).
                event.preventDefault();

                // Call the add player function.
                addPlayer();
            }
        });
    }
});