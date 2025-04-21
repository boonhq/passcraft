// Screen References: Store references to all page sections for navigation
const screens = {
    settings: document.getElementById('settings-page'),
    home: document.getElementById('home-page'),
    method: document.getElementById('method-page'),
    enter: document.getElementById('enter-page'),
    roll: document.getElementById('roll-page'),
    final: document.getElementById('final-page'),
    help: document.getElementById('help-page'),
    credits: document.getElementById('credits-page'),
    developer: document.getElementById('developer-page')
};

// Element References: Store references to key DOM elements
const greeting = document.getElementById('greeting');
const currentSettings = document.getElementById('current-settings');
const settingsLanguage = document.getElementById('settings-language');
const settingsTheme = document.getElementById('settings-theme');
const settingsLength = document.getElementById('settings-length');
const themeInstruction = document.getElementById('theme-instruction');
const enterInput = document.getElementById('enter-input');
const rollDisplay = document.getElementById('roll-display');
const enterPassphraseWords = document.getElementById('enter-passphrase-words');
const rollPassphraseWords = document.getElementById('roll-passphrase-words');
const enterCounter = document.getElementById('enter-counter');
const rollCounter = document.getElementById('roll-counter');
const rollPassphraseDisplay = document.getElementById('roll-passphrase-display');
const enterPassphraseDisplay = document.getElementById('enter-passphrase-display');
const finalPassphrase = document.getElementById('final-passphrase');
const copyFeedback = document.getElementById('copy-feedback');
const mnemonicTip = document.getElementById('mnemonic-text');
const contactName = document.getElementById('contact-name');
const contactEmail = document.getElementById('contact-email');
const contactMessage = document.getElementById('contact-message');
const contactFeedback = document.getElementById('contact-feedback');

// Greeting Options: Arrays of greeting messages for first-time and returning users
const firstTimeGreetings = ["Welcome!", "Howdy!", "Ahoy!", "Hey!", "Hi!"];
const returningGreetings = ["Welcome back!", "You're back!", "Glad you're back!", "Back again!"];

// Theme Mapping: Available themes for each language
const themesByLanguage = {
    en: [
        { value: 'wordlist-en-reinhold.json', text: 'EN Generic (Classic)' },
        { value: 'wordlist-en-beale.json', text: 'EN Generic (Beale)' },
        { value: 'wordlist-en-eff-large.json', text: 'EN Generic (EFF Large)' },
        { value: 'wordlist-en-eff-harry-potter.json', text: 'EN Harry Potter (adapted from EFF)' },
        { value: 'wordlist-en-eff-star-wars.json', text: 'EN Star Wars (adapted from EFF)' }
    ],
    fr: [
        { value: 'wordlist-fr-reinhold.json', text: 'FR Générique (Classic)' }
    ]
};

// Application State: Global state variables
let passphrase = []; // Array to store the generated passphrase words
let originalPassphrase = ''; // Store the original passphrase for reverting after enhancement
let isEnhanced = false; // Track if the displayed passphrase is enhanced
let wordlist = {}; // Object to store the loaded wordlist
let currentMethod = ''; // Track the current method ('enter' or 'roll')
let passphraseLength = 5; // Default passphrase length, updated from settings
let previousPage = ''; // Store the previous page for navigation from Help/Credits/Developer

// Buttons: Placeholder for button references (assigned in DOMContentLoaded)
let buttons;

// Equivalencies: Mapping for enhancing passphrase with numbers and symbols
const equivalencies = {
    'e': '3', 'E': '3', // Number
    'o': '0', 'O': '0', // Number
    'i': '1', 'I': '1', // Number
    'h': '#', 'H': '#', // Symbol
    's': '$', 'S': '$', // Symbol
    'a': '@', 'A': '@', // Symbol
    'l': '|', 'L': '|', // Symbol
    't': '+', 'T': '+'  // Symbol
};

// Utility Functions

// getRandomGreeting: Returns a random greeting from the provided options
function getRandomGreeting(options) {
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

// showScreen: Displays the specified screen by adding the 'active' class and hiding others
function showScreen(screenId, screens) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenId].classList.add('active');
}

// updatePassphraseDisplay: Updates the UI with the current passphrase and navigates to the final page if complete
function updatePassphraseDisplay(method, elements, state) {
    if (method === 'enter') {
        elements.enterPassphraseWords.textContent = state.passphrase.join(" ");
        elements.enterCounter.textContent = `Word ${state.passphrase.length} of ${state.passphraseLength}`;
    } else if (method === 'roll') {
        elements.rollPassphraseWords.textContent = state.passphrase.join(" ");
        elements.rollCounter.textContent = `Word ${state.passphrase.length} of ${state.passphraseLength}`;
    }
    if (state.passphrase.length === state.passphraseLength) {
        const finalPass = state.passphrase.join(" ");
        state.originalPassphrase = finalPass; // Store the original passphrase
        state.isEnhanced = false; // Reset enhancement state
        elements.finalPassphrase.textContent = finalPass;
        showScreen('final', screens);
        // Disable buttons to prevent further input
        if (method === 'enter') {
            buttons.enterNext.disabled = true;
        } else if (method === 'roll') {
            buttons.rollNext.disabled = true;
        }
        // Reset enhancement buttons
        buttons.finalEnhance.classList.remove('hidden');
        buttons.finalRevert.classList.add('hidden');
        // Reset mnemonic tip
        const mnemonicSection = document.getElementById('mnemonic-tip');
        mnemonicSection.classList.add('hidden');
        buttons.finalMemorize.textContent = 'Memorize';
    }
}

// resetApp: Resets the app to its initial state, clearing all data
function resetApp(screens, elements, state) {
    localStorage.clear();
    state.passphrase = [];
    state.originalPassphrase = '';
    state.isEnhanced = false;
    state.currentMethod = '';
    updatePassphraseDisplay('enter', elements, state);
    updatePassphraseDisplay('roll', elements, state);
    elements.greeting.textContent = getRandomGreeting(["Welcome!", "Howdy!", "Ahoy!", "Hey!", "Hi!"]);
    showScreen('settings', screens);
}

// resetSettings: Resets the settings form to its initial state
function resetSettings(elements) {
    // Reset Language dropdown
    elements.settingsLanguage.value = '';
    // Clear and disable Theme dropdown
    elements.settingsTheme.innerHTML = '';
    elements.settingsTheme.disabled = true;
    elements.themeInstruction.classList.remove('hidden');
    // Reset Passphrase Length to default (5 words)
    elements.settingsLength.value = '5';
}

// addWordFromInput: Adds a word to the passphrase based on a 5-digit input
function addWordFromInput(input, method, elements, state) {
    // Stop adding words if passphrase length is reached
    if (state.passphrase.length >= state.passphraseLength) {
        return;
    }
    if (/^[1-6]{5}$/.test(input)) {
        const word = state.wordlist[input] || "unknown";
        state.passphrase.push(word);
        updatePassphraseDisplay(method, elements, state);
        if (method === 'enter') {
            elements.enterInput.value = "";
            // Show the counter and passphrase display after the first word is added
            if (state.passphrase.length === 1) {
                elements.enterCounter.classList.remove('hidden');
                elements.enterPassphraseDisplay.classList.remove('hidden');
            }
        }
        if (method === 'roll') {
            elements.rollDisplay.value = "";
            // Show the counter and passphrase display after the first word is added
            if (state.passphrase.length === 1) {
                elements.rollCounter.classList.remove('hidden');
                elements.rollPassphraseDisplay.classList.remove('hidden');
            }
        }
    } else {
        alert("Invalid input! Please enter exactly 5 digits, each from 1 to 6 (e.g., 12345). Try rolling 5 dice to get your numbers.");
    }
}

// updateThemeDropdown: Updates the theme dropdown options based on the selected language
function updateThemeDropdown(language, elements) {
    console.log('Updating theme dropdown for language:', language);
    elements.settingsTheme.innerHTML = ''; // Clear existing options
    const themes = themesByLanguage[language] || [];
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.text;
        elements.settingsTheme.appendChild(option);
    });
    elements.settingsTheme.disabled = false; // Enable the dropdown
    elements.themeInstruction.classList.add('hidden'); // Hide the instruction
    // Pre-select "EN Generic (EFF Large)" for English
    if (language === 'en') {
        elements.settingsTheme.value = 'wordlist-en-eff-large.json';
    }
}

// updateCurrentSettingsDisplay: Updates the display of current settings on the Home page
function updateCurrentSettingsDisplay(elements) {
    const language = localStorage.getItem('language') || 'en';
    const theme = localStorage.getItem('theme') || 'wordlist-en-eff-large.json';
    const length = localStorage.getItem('passphraseLength') || '5';
    const themeOptions = themesByLanguage[language] || themesByLanguage['en'];
    const themeDisplay = themeOptions.find(opt => opt.value === theme)?.text || 'Unknown';
    elements.currentSettings.innerHTML = `Language: ${language === 'en' ? 'English' : 'French'}<br>Theme: ${themeDisplay}<br>Length: ${length} words`;
}

// loadWordlist: Loads the wordlist JSON file based on the selected theme
function loadWordlist(state) {
    const theme = localStorage.getItem('theme') || 'wordlist-en-eff-large.json';
    fetch(theme)
        .then(response => response.json())
        .then(data => {
            state.wordlist = data;
            console.log('Wordlist loaded:', Object.keys(state.wordlist).length, 'words');
        })
        .catch(error => console.error('Error loading wordlist:', error));
}

// generateMnemonicStory: Creates a mnemonic story to help memorize the passphrase (Journey Theme)
function generateMnemonicStory(passphrase) {
    const words = passphrase.split(" ");
    const length = words.length;

    // Validate passphrase length
    if (length < 4 || length > 6) {
        return "Passphrase must be between 4 and 6 words!";
    }

    // Journey Theme: [word1] [word2] traveled to [word3] by [word4] with [word5] seeking [word6].
    if (length === 4) {
        return `${words[0]} ${words[1]} traveled to ${words[2]} by ${words[3]}.`;
    } else if (length === 5) {
        return `${words[0]} ${words[1]} traveled to ${words[2]} by ${words[3]} with ${words[4]}.`;
    } else if (length === 6) {
        return `${words[0]} ${words[1]} traveled to ${words[2]} by ${words[3]} with ${words[4]} seeking ${words[5]}.`;
    }
}

// enhancePassphrase: Enhances the passphrase by adding an uppercase letter, a number, and a symbol
function enhancePassphrase(originalPassphrase) {
    let words = originalPassphrase.split(" ");
    
    // Step 1: Capitalize the first letter of a random word
    let randomWordIndex = Math.floor(Math.random() * words.length);
    words[randomWordIndex] = words[randomWordIndex].charAt(0).toUpperCase() + words[randomWordIndex].slice(1);

    // Step 2: Replace a letter with a number
    let numberReplaced = false;
    let numberKeys = ['e', 'E', 'o', 'O', 'i', 'I'];
    for (let i = 0; i < words.length && !numberReplaced; i++) {
        for (let j = 0; j < words[i].length && !numberReplaced; j++) {
            let char = words[i][j];
            if (numberKeys.includes(char)) {
                words[i] = words[i].substring(0, j) + equivalencies[char] + words[i].substring(j + 1);
                numberReplaced = true;
            }
        }
    }

    // Step 3: Replace a letter with a symbol (in a different word if possible)
    let symbolReplaced = false;
    let symbolKeys = ['h', 'H', 's', 'S', 'a', 'A', 'l', 'L', 't', 'T'];
    for (let i = 0; i < words.length && !symbolReplaced; i++) {
        for (let j = 0; j < words[i].length && !symbolReplaced; j++) {
            let char = words[i][j];
            if (symbolKeys.includes(char)) {
                words[i] = words[i].substring(0, j) + equivalencies[char] + words[i].substring(j + 1);
                symbolReplaced = true;
            }
        }
    }

    // Fallback: If no number or symbol was replaced, append '3#' to the last word
    if (!numberReplaced || !symbolReplaced) {
        words[words.length - 1] += '3#';
    }

    return words.join(" ");
}

// isValidEmail: Validates the email format using a regular expression
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// App Initialization: Runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Assign Buttons: Map button IDs to their DOM elements
    buttons = {
        settingsSave: document.getElementById('settings-save'),
        settingsReset: document.getElementById('settings-reset'),
        homeContinue: document.getElementById('home-continue'),
        methodBack: document.getElementById('method-back'),
        methodEnter: document.getElementById('method-enter'),
        methodRoll: document.getElementById('method-roll'),
        enterNext: document.getElementById('enter-next'),
        enterBack: document.getElementById('enter-back'),
        rollNext: document.getElementById('roll-next'),
        rollBack: document.getElementById('roll-back'),
        settingsBtn: document.getElementById('settings-btn'),
        finalCopy: document.getElementById('final-copy'),
        finalMemorize: document.getElementById('final-memorize'),
        finalEnhance: document.getElementById('final-enhance'),
        finalRevert: document.getElementById('final-revert'),
        finalRestart: document.getElementById('final-restart'),
        helpBack: document.getElementById('help-back'),
        creditsBack: document.getElementById('credits-back'),
        developerBack: document.getElementById('developer-back'),
        contactSend: document.getElementById('contact-send')
    };

    // Footer Links: References to navigation links in the footer of each page
    const helpLinks = {
        settings: document.getElementById('settings-help-link'),
        home: document.getElementById('home-help-link'),
        method: document.getElementById('method-help-link'),
        enter: document.getElementById('enter-help-link'),
        roll: document.getElementById('roll-help-link'),
        final: document.getElementById('final-help-link'),
        help: document.getElementById('help-help-link'),
        credits: document.getElementById('credits-help-link'),
        developer: document.getElementById('developer-help-link')
    };

    const creditsLinks = {
        settings: document.getElementById('settings-credits-link'),
        home: document.getElementById('home-credits-link'),
        method: document.getElementById('method-credits-link'),
        enter: document.getElementById('enter-credits-link'),
        roll: document.getElementById('roll-credits-link'),
        final: document.getElementById('final-credits-link'),
        help: document.getElementById('help-credits-link'),
        credits: document.getElementById('credits-credits-link'),
        developer: document.getElementById('developer-credits-link')
    };

    const developerLinks = {
        settings: document.getElementById('settings-developer-link'),
        home: document.getElementById('home-developer-link'),
        method: document.getElementById('method-developer-link'),
        enter: document.getElementById('enter-developer-link'),
        roll: document.getElementById('roll-developer-link'),
        final: document.getElementById('final-developer-link'),
        help: document.getElementById('help-developer-link'),
        credits: document.getElementById('credits-developer-link'),
        developer: document.getElementById('developer-developer-link')
    };

    // Elements Object: Collect all element references for easy access
    const elements = {
        greeting,
        currentSettings,
        settingsLanguage,
        settingsTheme,
        settingsLength,
        themeInstruction,
        enterInput,
        rollDisplay,
        enterPassphraseWords,
        rollPassphraseWords,
        enterCounter,
        rollCounter,
        rollPassphraseDisplay,
        enterPassphraseDisplay,
        finalPassphrase,
        copyFeedback,
        mnemonicTip,
        contactName,
        contactEmail,
        contactMessage,
        contactFeedback
    };

    // State Object: Collect all state variables for easy access
    const state = {
        passphrase,
        originalPassphrase,
        isEnhanced,
        wordlist,
        currentMethod,
        passphraseLength,
        previousPage
    };
    
    // Initial Setup: Determine if the user is new or returning
    if (localStorage.getItem('language')) {
        // Returning user: Show home page with a returning greeting
        elements.greeting.textContent = getRandomGreeting(returningGreetings);
        updateCurrentSettingsDisplay(elements);
        loadWordlist(state);
        showScreen('home', screens);
    } else {
        // First-time user: Show settings page with a first-time greeting
        elements.greeting.textContent = getRandomGreeting(firstTimeGreetings);
        showScreen('settings', screens);
    }

    // Footer Navigation: Event listeners for Help, Credits, and Developer links
    Object.keys(helpLinks).forEach(screen => {
        if (helpLinks[screen]) { // Ensure the link exists
            helpLinks[screen].addEventListener('click', (event) => {
                event.preventDefault();
                // Only navigate if not already on the help page
                if (screen !== 'help') {
                    state.previousPage = screen;
                    showScreen('help', screens);
                }
            });
        }
    });

    Object.keys(creditsLinks).forEach(screen => {
        if (creditsLinks[screen]) { // Ensure the link exists
            creditsLinks[screen].addEventListener('click', (event) => {
                event.preventDefault();
                // Only navigate if not already on the credits page
                if (screen !== 'credits') {
                    state.previousPage = screen;
                    showScreen('credits', screens);
                }
            });
        }
    });

    Object.keys(developerLinks).forEach(screen => {
        if (developerLinks[screen]) { // Ensure the link exists
            developerLinks[screen].addEventListener('click', (event) => {
                event.preventDefault();
                // Only navigate if not already on the developer page
                if (screen !== 'developer') {
                    state.previousPage = screen;
                    showScreen('developer', screens);
                    // Reset form and feedback on navigation
                    elements.contactName.value = '';
                    elements.contactEmail.value = '';
                    elements.contactMessage.value = '';
                    elements.contactFeedback.classList.add('hidden');
                    elements.contactFeedback.textContent = '';
                }
            });
        }
    });

    // Back Buttons: Event listeners for returning from Help, Credits, and Developer pages
    buttons.helpBack.addEventListener('click', () => {
        const targetPage = state.previousPage === 'help' || state.previousPage === 'credits' || state.previousPage === 'developer' ? 'home' : state.previousPage;
        showScreen(targetPage || 'home', screens);
    });

    buttons.creditsBack.addEventListener('click', () => {
        const targetPage = state.previousPage === 'help' || state.previousPage === 'credits' || state.previousPage === 'developer' ? 'home' : state.previousPage;
        showScreen(targetPage || 'home', screens);
    });

    buttons.developerBack.addEventListener('click', () => {
        const targetPage = state.previousPage === 'help' || state.previousPage === 'credits' || state.previousPage === 'developer' ? 'home' : state.previousPage;
        showScreen(targetPage || 'home', screens);
    });

    // Contact Form Submission: Handle form submission on the Developer page
    buttons.contactSend.addEventListener('click', () => {
        const name = elements.contactName.value.trim();
        const email = elements.contactEmail.value.trim();
        const message = elements.contactMessage.value.trim();

        // Client-side validation
        if (!name || !email || !message) {
            elements.contactFeedback.textContent = 'Please fill out all fields.';
            elements.contactFeedback.classList.remove('hidden');
            elements.contactFeedback.classList.remove('success');
            elements.contactFeedback.classList.add('error');
            return;
        }

        if (!isValidEmail(email)) {
            elements.contactFeedback.textContent = 'Please enter a valid email address.';
            elements.contactFeedback.classList.remove('hidden');
            elements.contactFeedback.classList.remove('success');
            elements.contactFeedback.classList.add('error');
            return;
        }

        // Prepare form data for submission
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('message', message);

        // Submit to Formspree
        const formspreeEndpoint = 'https://formspree.io/f/mjkynedb';

        fetch(formspreeEndpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                elements.contactFeedback.textContent = 'Thank you for your message! We’ll get back to you soon.';
                elements.contactFeedback.classList.remove('hidden');
                elements.contactFeedback.classList.remove('error');
                elements.contactFeedback.classList.add('success');
                // Clear the form
                elements.contactName.value = '';
                elements.contactEmail.value = '';
                elements.contactMessage.value = '';
            } else {
                elements.contactFeedback.textContent = 'Error sending message. Please try again later.';
                elements.contactFeedback.classList.remove('hidden');
                elements.contactFeedback.classList.remove('success');
                elements.contactFeedback.classList.add('error');
            }
        })
        .catch(error => {
            console.error('Form submission error:', error);
            elements.contactFeedback.textContent = 'Error sending message. Please check your connection and try again.';
            elements.contactFeedback.classList.remove('hidden');
            elements.contactFeedback.classList.remove('success');
            elements.contactFeedback.classList.add('error');
        });
    });

    // Event Listeners: Core functionality for navigation and interactions

    // Language Selection: Update theme dropdown when a language is selected
    elements.settingsLanguage.addEventListener('change', () => {
        const language = elements.settingsLanguage.value;
        console.log('Language selected:', language);
        if (language) {
            updateThemeDropdown(language, elements);
        }
    });

    // Save Settings: Store settings in localStorage and proceed to Home page
    buttons.settingsSave.addEventListener('click', () => {
        if (!elements.settingsLanguage.value) {
            alert("Please select a language!");
            return;
        }
        localStorage.setItem('language', elements.settingsLanguage.value);
        localStorage.setItem('theme', elements.settingsTheme.value);
        localStorage.setItem('passphraseLength', elements.settingsLength.value);
        state.passphraseLength = parseInt(elements.settingsLength.value);
        updateCurrentSettingsDisplay(elements);
        loadWordlist(state);
        elements.greeting.textContent = getRandomGreeting(firstTimeGreetings);
        showScreen('home', screens);
    });

    // Reset Settings: Clear the settings form
    buttons.settingsReset.addEventListener('click', () => {
        resetSettings(elements);
    });

    // Continue from Home: Navigate to method selection
    buttons.homeContinue.addEventListener('click', () => showScreen('method', screens));

    // Back from Method: Return to Home page
    buttons.methodBack.addEventListener('click', () => showScreen('home', screens));

    // Enter Numbers Method: Start manual number entry
    buttons.methodEnter.addEventListener('click', () => {
        state.currentMethod = 'enter';
        state.passphrase = [];
        updatePassphraseDisplay(state.currentMethod, elements, state);
        buttons.enterNext.disabled = false;
        elements.enterCounter.classList.add('hidden');
        elements.enterPassphraseDisplay.classList.add('hidden');
        showScreen('enter', screens);
    });

    // Roll for Me Method: Start simulated dice rolls
    buttons.methodRoll.addEventListener('click', () => {
        state.currentMethod = 'roll';
        state.passphrase = [];
        updatePassphraseDisplay(state.currentMethod, elements, state);
        buttons.rollNext.disabled = false;
        elements.rollDisplay.value = '';
        elements.rollCounter.classList.add('hidden');
        elements.rollPassphraseDisplay.classList.add('hidden');
        showScreen('roll', screens);
    });

    // Next in Enter Numbers: Add the entered number to the passphrase
    buttons.enterNext.addEventListener('click', () => {
        if (state.passphrase.length < state.passphraseLength) {
            const input = elements.enterInput.value.trim();
            addWordFromInput(input, 'enter', elements, state);
        }
    });

    // Back from Enter Numbers: Return to method selection
    buttons.enterBack.addEventListener('click', () => showScreen('method', screens));

    // Roll Next: Generate a new 5-digit number and add it to the passphrase
    buttons.rollNext.addEventListener('click', () => {
        if (state.passphrase.length < state.passphraseLength) {
            let roll = elements.rollDisplay.value;
            if (!roll) {
                // First roll
                roll = Array(5).fill().map(() => Math.floor(Math.random() * 6) + 1).join('');
                elements.rollDisplay.value = roll;
            }
            addWordFromInput(roll, 'roll', elements, state);
            if (state.passphrase.length < state.passphraseLength) {
                const newRoll = Array(5).fill().map(() => Math.floor(Math.random() * 6) + 1).join('');
                elements.rollDisplay.value = newRoll;
            }
        }
    });

    // Back from Roll for Me: Return to method selection
    buttons.rollBack.addEventListener('click', () => showScreen('method', screens));

    // Revisit Settings: Load current settings and navigate to Settings page
    buttons.settingsBtn.addEventListener('click', () => {
        const savedLanguage = localStorage.getItem('language') || 'en';
        const theme = localStorage.getItem('theme') || 'wordlist-en-eff-large.json';
        const savedLength = localStorage.getItem('passphraseLength') || '5';
        elements.settingsLanguage.value = savedLanguage;
        updateThemeDropdown(savedLanguage, elements);
        elements.settingsTheme.value = theme;
        elements.settingsLength.value = savedLength;
        showScreen('settings', screens);
    });

    // Final Page Interactions: Handle passphrase management with touch support

    // Copy Passphrase: Copy the passphrase to the clipboard
    const copyHandler = (event) => {
        event.preventDefault();
        navigator.clipboard.writeText(elements.finalPassphrase.textContent)
            .then(() => {
                elements.copyFeedback.classList.remove('hidden');
                setTimeout(() => {
                    elements.copyFeedback.classList.add('hidden');
                }, 2000); // Hide feedback after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy passphrase:', err);
                alert('Failed to copy passphrase. Please try again.');
            });
    };
    buttons.finalCopy.addEventListener('click', copyHandler);
    buttons.finalCopy.addEventListener('touchstart', copyHandler);
    buttons.finalCopy.addEventListener('touchend', (event) => event.preventDefault());

    // Memorize Passphrase: Toggle the mnemonic tip visibility
    let isMemorizeToggling = false; // Debounce flag for memorize toggle
    const memorizeHandler = (event) => {
        event.preventDefault();
        if (isMemorizeToggling) return;
        isMemorizeToggling = true;
        setTimeout(() => { isMemorizeToggling = false; }, 300); // Debounce for 300ms

        const mnemonicSection = document.getElementById('mnemonic-tip');
        mnemonicSection.classList.toggle('hidden');
        if (!mnemonicSection.classList.contains('hidden')) {
            elements.mnemonicTip.textContent = generateMnemonicStory(elements.finalPassphrase.textContent);
            buttons.finalMemorize.textContent = 'Hide Memorization Tip';
        } else {
            buttons.finalMemorize.textContent = 'Memorize';
        }
    };
    buttons.finalMemorize.addEventListener('click', memorizeHandler);
    buttons.finalMemorize.addEventListener('touchstart', memorizeHandler);
    buttons.finalMemorize.addEventListener('touchend', (event) => event.preventDefault());

    // Enhance Passphrase: Add uppercase letter, number, and symbol to the passphrase
    const enhanceHandler = (event) => {
        event.preventDefault();
        const enhancedPassphrase = enhancePassphrase(state.originalPassphrase);
        elements.finalPassphrase.textContent = enhancedPassphrase;
        state.isEnhanced = true;
        buttons.finalEnhance.classList.add('hidden');
        buttons.finalRevert.classList.remove('hidden');
        // Reset mnemonic tip when enhancing
        const mnemonicSection = document.getElementById('mnemonic-tip');
        mnemonicSection.classList.add('hidden');
        buttons.finalMemorize.textContent = 'Memorize';
    };
    buttons.finalEnhance.addEventListener('click', enhanceHandler);
    buttons.finalEnhance.addEventListener('touchstart', enhanceHandler);
    buttons.finalEnhance.addEventListener('touchend', (event) => event.preventDefault());

    // Revert Passphrase: Revert to the original passphrase
    const revertHandler = (event) => {
        event.preventDefault();
        elements.finalPassphrase.textContent = state.originalPassphrase;
        state.isEnhanced = false;
        buttons.finalEnhance.classList.remove('hidden');
        buttons.finalRevert.classList.add('hidden');
        // Reset mnemonic tip when reverting
        const mnemonicSection = document.getElementById('mnemonic-tip');
        mnemonicSection.classList.add('hidden');
        buttons.finalMemorize.textContent = 'Memorize';
    };
    buttons.finalRevert.addEventListener('click', revertHandler);
    buttons.finalRevert.addEventListener('touchstart', revertHandler);
    buttons.finalRevert.addEventListener('touchend', (event) => event.preventDefault());

    // Restart App: Reset the app state and return to the current method
    const restartHandler = (event) => {
        event.preventDefault();
        state.passphrase = [];
        state.originalPassphrase = '';
        state.isEnhanced = false;
        updatePassphraseDisplay(state.currentMethod, elements, state);
        // Hide counter and passphrase display based on the current method
        if (state.currentMethod === 'enter') {
            elements.enterCounter.classList.add('hidden');
            elements.enterPassphraseDisplay.classList.add('hidden');
            buttons.enterNext.disabled = false; // Re-enable the button
            elements.enterInput.value = ''; // Clear the input field
        } else if (state.currentMethod === 'roll') {
            elements.rollCounter.classList.add('hidden');
            elements.rollPassphraseDisplay.classList.add('hidden');
            buttons.rollNext.disabled = false; // Re-enable the button
            elements.rollDisplay.value = ''; // Clear the roll display
        }
        // Reset the mnemonic tip section
        const mnemonicSection = document.getElementById('mnemonic-tip');
        mnemonicSection.classList.add('hidden');
        buttons.finalMemorize.textContent = 'Memorize';
        showScreen(state.currentMethod, screens);
    };
    buttons.finalRestart.addEventListener('click', restartHandler);
    buttons.finalRestart.addEventListener('touchstart', restartHandler);
    buttons.finalRestart.addEventListener('touchend', (event) => event.preventDefault());
});