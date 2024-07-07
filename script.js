window.onload = async () => {
    let word = await getWord();
    while (word.includes('-')) {
        word = await getWord();
    }

    setMenuButtons();
    game = new GameState(word);
};

function GameState(word) {
    this.theWord = word;

    this.inputBoxes = initalizeBoard(this);
    this.keyHash    = syncOnScreenKeyboard(this);

    this.length = this.inputBoxes.length

    this.index = 0;
    this.guess = [];
    this.gameOver = false;
    this.totalGuesses = 0;

    this.incrementIndex = () => { 
        if (this.index < this.length) {
            this.reFocus(this.index + 1);
            this.index += 1; 
        }
    }

    this.decrementIndex = () => { 
        if (this.index > 0) {
            this.reFocus(this.index - 1);
            this.index -= 1; 
        }
    } 

    this.reFocus = (newIndex) => { 
        this.inputBoxes[newIndex].style.borderColor = "rgb(207, 207, 207)";
    }

    this.handleInput = onInput;
    this.checkGuess = compareStrings;
    this.colorKeyboard = updateKeyboard;
    
    this.incrementCookie = (cookieName) => {
        let cookieArray = document.cookie.split('; ');
        value = 1;
        cookieArray.forEach((cookie) => {
            let [name, val] = cookie.split('=');
            if (name == cookieName) {
                value = parseInt(val, 10);
                if (!isNaN(value)) {
                    value += 1;
                }
            }
        });

        console.log(cookieName + ": " + value);
    
        let date = new Date();
        let days = 365;
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = "expires=" + date.toUTCString();
        document.cookie = `${cookieName}=${value}; ${expires}; path=/`;
    }

    this.incrementCookie("gamesPlayed");

}

async function getWord() {
    let response = await fetch("https://random-word-api.vercel.app/api?words=1&length=5");
    let randomWord = await response.json();

    return randomWord[0];
}


/* Initialize the gameboard */
function initalizeBoard(gameState) {
    inputBoxes = Array.from(document.getElementsByName("letterBox"));
    inputBoxes[0].style.borderColor = "rgb(207, 207, 207)";
    
    window.addEventListener('keydown', (event) => { /* handle input */
        gameState.handleInput(event.key);
    });

    return inputBoxes;
}

function syncOnScreenKeyboard(gameState) {
    keys = Array.from(document.getElementsByName("letter"));
    keyboardHash = {}

    keys.forEach((key) => {
        keyboardHash[key.innerHTML] = key;

        key.addEventListener('click', () => {
            gameState.handleInput(key.innerHTML.toLowerCase())
        });
    });

    enterButton = document.getElementById("enter");
    enterButton.addEventListener('click', () => {
        gameState.handleInput('Enter')
    });
    
    deleteButton = document.getElementById("delete");
    deleteButton.addEventListener('click', () => {
        gameState.handleInput('Backspace')
    });

    return keyboardHash;
}

function onInput(input) { 
    if (isLetter(input) && (this.guess.length < 4)) {
        this.inputBoxes[this.index].style.borderColor = "#3a3a3c";
        this.inputBoxes[this.index].innerHTML = input;
        this.incrementIndex();
        this.guess.push(input);
    } else if (isLetter(input) && (this.guess.length == 4)) {
        this.inputBoxes[this.index].innerHTML = input;
        this.guess.push(input);
    } else if ((input == "Backspace") && (this.guess.length > 0) && (this.guess.length < 5)) {
        this.inputBoxes[this.index].style.borderColor = "#3a3a3c";
        this.decrementIndex();
        this.inputBoxes[this.index].innerHTML = '';
        this.guess.pop();
    } else if ((input == "Backspace") && (this.guess.length > 0)) {
        this.inputBoxes[this.index].innerHTML = '';
        this.guess.pop();
    } else if ((input == "Enter") && (this.guess.length == 5)) {
        this.incrementCookie("totalGuesses");
        guessString = this.guess.join('');
        this.inputBoxes[this.index].style.borderColor = "#3a3a3c";
        this.totalGuesses += 1;
        if (this.checkGuess(this.guess)) {
            this.incrementCookie("wins");
            writeStats()
            won(this);
            return;
        } else {
            if (this.index <= 25) {
                this.incrementIndex();
            } else {
                writeStats()
                lost(this);
            }
        }
        this.guess = [];
    }
}


function won(gameState) {
    result_box = document.getElementById("endGame");
    result_box.style.display = "flex";

    lose_box = document.getElementById("lose");
    lose_box.style.display = "none";

    summaryBoxes = Array.from(document.getElementsByClassName("summaryBox"));

    for (let i = 0; i <= gameState.index; i++) {

        setTimeout( ()=> {
            let color = gameState.inputBoxes[i].style.backgroundColor;
            summaryBoxes[i].style.backgroundColor = color;
            summaryBoxes[i].style.visibility = "visible";
        }, 200 * (1.09 ** i));
    }

    gameState.gameOver = true;
}

function lost(gameState) {
    result_box = document.getElementById("endGame");
    result_box.style.display = "flex";

    win_box = document.getElementById("win");
    win_box.style.display = "none";

    summaryBoxes = Array.from(document.getElementsByClassName("summaryBox"));

    for (let i = 0; i < gameState.length; i++) {

        setTimeout( ()=> {
            let color = gameState.inputBoxes[i].style.backgroundColor;
            summaryBoxes[i].style.backgroundColor = color;
            summaryBoxes[i].style.visibility = "visible";
        }, 200 * (1.09 ** i));
    }

    document.getElementById("correctWord").style.display = "flex";
    document.getElementById("title").style.visibility = "hidden";
    document.getElementById("correctWord").innerText = gameState.theWord.toUpperCase();


    gameState.gameOver = true;
}

function isLetter(input) {
    let ascii = input.charCodeAt(0);
    let len = (input.length == 1);

    return ((ascii >= 65 && ascii <= 90) || (ascii >= 97 && ascii <= 122)) && (len)
}

function compareStrings(guess) {
    let answer = this.theWord.split('');
    let compArray = [0, 0, 0, 0, 0];
    let win = true


    for (let i = 0; i < compArray.length; i++) {    
        if (guess[i] == answer[i]) {
            compArray[i] = "correct";
            answer[i] = '';
        } 
    }

    for (let i = 0; i < compArray.length; i++) {
        if (compArray[i] == 0 && answer.includes(guess[i])) {
            let index = answer.indexOf(guess[i]);
            compArray[i] = "contains";
            answer[index] = '';
            win = false;
        }
    }

    for (let i = 0; i < compArray.length; i++) {        
        if (compArray[i] == 0) {
            compArray[i] = "incorrect";
            win = false;
        }
    }

    compArray.forEach((value, guessIndex) => {
        let index = this.index - (4 - guessIndex);
        let green = "#538d4e";
        let yellow = "#b59f3b";
        let grey = "#3a3a3c";
        
        let letter = (inputBoxes[index].innerHTML).toUpperCase();

        setTimeout( ()=> {
            if (value == "correct") {
                inputBoxes[index].style.backgroundColor = green;
                inputBoxes[index].style.borderColor = green;
                this.colorKeyboard(green, letter)
            } else if (value == "contains") {
                inputBoxes[index].style.backgroundColor = yellow;
                inputBoxes[index].style.borderColor = yellow;
                this.colorKeyboard(yellow, letter)
            } else if (value == "incorrect") {
                inputBoxes[index].style.backgroundColor = grey;
                inputBoxes[index].style.borderColor = grey;
                this.colorKeyboard(grey, letter)
            }
        }, 90 * ((index % 5)));
    });

    return win;
}

function updateKeyboard(newColor, letter) {
    let colors = ["#538d4e", "#b59f3b", "#3a3a3c"];

    let key = this.keyHash[letter];
    let currColorRGB = key.style.backgroundColor;

    if (currColorRGB) {
        let currColorParser = currColorRGB.match(/[0-9]+/g);
        let r = parseInt(currColorParser[0]).toString(16).padStart(2, '0');
        let g = parseInt(currColorParser[1]).toString(16).padStart(2, '0');
        let b = parseInt(currColorParser[2]).toString(16).padStart(2, '0');
        var currColor = `#${r}${g}${b}`;
    }

    if (!currColor || (colors.indexOf(newColor) < colors.indexOf(currColor))) {
        key.style.backgroundColor = newColor;
        key.style.borderColor = newColor;
    }
}

function setMenuButtons() {
    menu = document.getElementsByClassName("menuOption");
    playAgain = menu[0];
    seeBoard  = menu[1];

    resultBox = document.getElementById("endGame");
    smallMenuContainer = document.getElementById("smallMenu");
    keyboard = document.getElementById("keyboardContainer");

    playAgain.addEventListener('click', () => {
        window.location.reload();
    });

    seeBoard.addEventListener('click', () => {
        resultBox.style.display = "none";
        smallMenuContainer.style.display = "flex";
        keyboard.style.display = "none";
    });

    smallMenuButton = document.getElementsByClassName("smallMenuOption");
    playAgain = smallMenuButton[0];
    viewStats  = smallMenuButton[1];

    playAgain.addEventListener('click', () => {
        window.location.reload();
    });

    viewStats.addEventListener('click', () => {
        resultBox.style.display = "flex";
        smallMenuContainer.style.display = "none";
        keyboard.style.display = "flex";

    });
}

function getCookie (cookieName) {
    let cookieArray = document.cookie.split('; ');
    let value = 0;

    for (let i = 0; i < cookieArray.length; i++) {
        [currCookie, val] = cookieArray[i].split('=');
        if (currCookie == cookieName) {
            value = parseInt(val, 10);
            if (!isNaN(value)) {
                console.log(value);
                return value;
            }
        } 
    }
    return 0;
}

function writeStats() {
    stats = document.getElementsByClassName("stat");

    wins = getCookie("wins");
    games = getCookie("gamesPlayed");
    guesses = getCookie("totalGuesses");

    winPCT = Math.round((wins/games) * 100);
    avgGuesses = parseFloat((guesses/games).toFixed(2));

    stats[0].innerText = winPCT + "%";
    stats[1].innerText = avgGuesses;
}