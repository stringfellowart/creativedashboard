let cardCount = 0;
const cardsContainer = document.getElementById('cardsContainer');
let promptData = {};

// Load data from JSON files with detailed error logging
async function loadData() {
    try {
        const fetches = [
            fetch('actors.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch actors.json: ${res.status}`);
                return res.json();
            }),
            fetch('modifiers.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch modifiers.json: ${res.status}`);
                return res.json();
            }),
            fetch('motivators.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch motivators.json: ${res.status}`);
                return res.json();
            }),
            fetch('characters.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch characters.json: ${res.status}`);
                return res.json();
            }),
            fetch('places.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch places.json: ${res.status}`);
                return res.json();
            }),
            fetch('things.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch things.json: ${res.status}`);
                return res.json();
            }),
            fetch('conflicts.json').then(res => {
                if (!res.ok) throw new Error(`Failed to fetch conflicts.json: ${res.status}`);
                return res.json();
            })
        ];
        const [actors, modifiers, motivators, characters, places, things, conflicts] = await Promise.all(fetches);
        promptData = {
            "Actor": actors,
            "Actor Modifier": modifiers,
            "Motivator": motivators,
            "Character": characters,
            "Character Modifier": modifiers,
            "Place": places,
            "Place Modifier": modifiers,
            "Thing": things,
            "Thing Modifier": modifiers,
            "Conflict": conflicts
        };
        console.log('Data loaded successfully:', Object.keys(promptData));
        initializeCards();
    } catch (error) {
        console.error('Error loading prompt data:', error);
        document.getElementById('promptOutput').innerText = "Error loading prompt data: " + error.message;
    }
}

// Function to get the correct article ("a" or "an")
function getArticle(word) {
    const firstLetter = word[0].toLowerCase();
    return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
}

// Function to add a new card
function addCard(type = null) {
    const cardId = `card-${cardCount++}`;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.innerHTML = `
        <select id="select-${cardId}">
            <option value="Actor">Actor</option>
            <option value="Actor Modifier">Actor Modifier</option>
            <option value="Motivator">Motivator</option>
            <option value="Character">Character</option>
            <option value="Character Modifier">Character Modifier</option>
            <option value="Place">Place</option>
            <option value="Place Modifier">Place Modifier</option>
            <option value="Thing">Thing</option>
            <option value="Thing Modifier">Thing Modifier</option>
            <option value="Conflict">Conflict</option>
        </select>
        <button onclick="generateCardPrompt('${cardId}')">Pick another card</button>
        <button class="remove-btn" onclick="removeCard('${cardId}')">X</button>
        <p id="result-${cardId}"></p>
    `;
    if (type) {
        card.querySelector('select').value = type;
    }
    return card;
}

// Function to add a plus button
function addPlusButton() {
    const plusButton = document.createElement('button');
    plusButton.textContent = '+';
    plusButton.className = 'plus-btn';
    plusButton.onclick = function() {
        const newCard = addCard();
        const nextCard = this.nextElementSibling;
        cardsContainer.insertBefore(newCard, this.nextElementSibling);
        if (nextCard && nextCard.className !== 'plus-btn') {
            const newPlus = addPlusButton();
            cardsContainer.insertBefore(newPlus, nextCard);
        }
        generatePrompt();
    };
    return plusButton;
}

// Function to generate a prompt for a specific card
function generateCardPrompt(cardId) {
    const card = document.getElementById(cardId);
    const select = card.querySelector('select');
    const type = select.value;
    if (!promptData[type] || !promptData[type].length) {
        console.warn(`No data available for ${type}`);
        return;
    }
    const items = promptData[type];
    const item = items[Math.floor(Math.random() * items.length)];
    const resultP = card.querySelector('p');
    resultP.innerHTML = `<strong>${type}:</strong> ${item}`;
    generatePrompt();
}

// Function to remove a card and adjust plus buttons
function removeCard(cardId) {
    const card = document.getElementById(cardId);
    const prevSibling = card.previousElementSibling;
    const nextSibling = card.nextElementSibling;
    card.remove();
    if (nextSibling && nextSibling.className === 'plus-btn' && 
        prevSibling && prevSibling.className === 'plus-btn') {
        nextSibling.remove();
    }
    generatePrompt();
}

// Function to generate the full prompt sentence with flexible card combinations
function generatePrompt() {
    const cards = Array.from(cardsContainer.getElementsByClassName('card'));
    let actorPhrases = [];
    let currentActorModifiers = [];
    let motivatorTargetPairs = [];
    let currentTargetModifiers = [];
    let currentMotivator = null;
    let lastTargetType = null;
    let conflicts = []; // Explicitly defined here

    cards.forEach(card => {
        const select = card.querySelector('select');
        const type = select.value;
        const resultP = card.querySelector('p');
        let item = resultP.textContent.replace(`${type}: `, '').trim();
        if (!item) return;

        if (type === "Actor Modifier") {
            currentActorModifiers.push(item);
        } else if (type === "Actor") {
            const firstWord = currentActorModifiers.length > 0 ? currentActorModifiers[0] : item;
            const article = getArticle(firstWord);
            const actorPhrase = `${article} ${currentActorModifiers.join(' ')} ${item}`.trim();
            actorPhrases.push(actorPhrase);
            currentActorModifiers = [];
        } else if (type === "Motivator") {
            if (currentMotivator) {
                motivatorTargetPairs.push(`${currentMotivator} something`);
            }
            currentMotivator = item;
        } else if (type === "Character Modifier" || type === "Place Modifier" || type === "Thing Modifier") {
            currentTargetModifiers.push(item);
        } else if (type === "Character" || type === "Place" || type === "Thing") {
            const firstTargetWord = currentTargetModifiers.length > 0 ? currentTargetModifiers[0] : item;
            const targetArticle = getArticle(firstTargetWord);
            const targetPhrase = `${targetArticle} ${currentTargetModifiers.join(' ')} ${item}`.trim();

            if (currentMotivator) {
                if (lastTargetType === "Character" && type === "Character") {
                    const lastPairIndex = motivatorTargetPairs.length - 1;
                    if (lastPairIndex >= 0) {
                        motivatorTargetPairs[lastPairIndex] += ` with ${targetPhrase}`;
                    } else {
                        motivatorTargetPairs.push(`${currentMotivator} ${targetPhrase}`);
                    }
                } else {
                    motivatorTargetPairs.push(`${currentMotivator} ${targetPhrase}`);
                }
                currentMotivator = null;
            } else {
                motivatorTargetPairs.push(`does something with ${targetPhrase}`);
            }
            currentTargetModifiers = [];
            lastTargetType = type;
        } else if (type === "Conflict") {
            conflicts.push(item);
        }
    });

    if (currentMotivator) {
        motivatorTargetPairs.push(`${currentMotivator} something`);
    }

    const actorsText = actorPhrases.length > 0 ? actorPhrases.join(' and ') : 'someone';
    const motivatorText = motivatorTargetPairs.length > 0 
        ? motivatorTargetPairs.join(', who ') 
        : 'does something';
    const conflictsText = conflicts.length > 0 ? `but ${conflicts.join(' and ')}` : 'but faces an obstacle';
    const prompt = `${actorsText} ${motivatorText}, ${conflictsText}.`;

    const capitalizedPrompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
    document.getElementById('promptOutput').innerText = capitalizedPrompt;
}

// Function to generate prompts without resetting if more than 5 cards
function generateStandardPrompt() {
    const cards = Array.from(cardsContainer.getElementsByClassName('card'));
    if (cards.length <= 5) {
        cardsContainer.innerHTML = '';
        const initialTypes = ['Actor Modifier', 'Actor', 'Motivator', 'Thing', 'Conflict'];
        initialTypes.forEach((type, index) => {
            const card = addCard(type);
            cardsContainer.appendChild(card);
            if (index < initialTypes.length - 1) {
                const plusButton = addPlusButton();
                cardsContainer.appendChild(plusButton);
            }
            generateCardPrompt(card.id);
        });
    } else {
        cards.forEach(card => generateCardPrompt(card.id));
    }
}

// Function to export saved prompts to a TXT file
function exportToTxt() {
    const text = document.getElementById('savedPrompts').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'saved_prompts.txt';
    link.click();
    URL.revokeObjectURL(link.href);
}

// Initialize after data load
function initializeCards() {
    if (Object.keys(promptData).length === 0) {
        console.warn('Prompt data not loaded yet, delaying initialization');
        return;
    }
    const initialTypes = ['Actor Modifier', 'Actor', 'Motivator', 'Thing', 'Conflict'];
    initialTypes.forEach((type, index) => {
        const card = addCard(type);
        cardsContainer.appendChild(card);
        if (index < initialTypes.length - 1) {
            const plusButton = addPlusButton();
            cardsContainer.appendChild(plusButton);
        }
        generateCardPrompt(card.id);
    });
}

// Start the process
loadData();
