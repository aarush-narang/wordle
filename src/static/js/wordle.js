(async () => {
    const MESSAGES = new Map().set('en', [
        ['Unbelieveable!', 'Incredible!'],
        ['Spectacular!', 'Amazing!'],
        ['Impressive!', 'Remarkable!'],
        ['Great Job!', 'Cool!'],
        ['Nice!', 'Great!'],
        ['Phew!', 'Close one!']
    ]).set('es', [
        [],
        [],
        [],
        [],
        [],
        [] // TODO: add complements for Spanish
    ])

    const modalClose = document.getElementById('modal-close');
    const statsModal = document.getElementById('stats-modal');
    // const helpModal = document.getElementById('help-modal');
    const settingsModal = document.getElementById('settings-modal')

    // implement stats button modal and settings modal
    const statsBtn = document.getElementById('stats')

    const helpBtn = document.getElementById('help')
    // const helpExamples = document.getElementById('help-examples');
    // const exampleTiles = helpExamples.querySelectorAll('.tile')

    function flipTile(tile) {
        tile.setAttribute('data-animation', 'flip-in')
        setTimeout(() => {
            tile.setAttribute('data-animation', 'flip-out')
            setTimeout(() => {
                tile.setAttribute('data-animation', 'idle')
            }, 250);
        }, 250);
    }

    function popTile(tile) {
        tile.setAttribute('data-animation', 'pop')
        setTimeout(() => {
            tile.setAttribute('data-animation', 'idle')
        }, 100);
    }

    function shakeRow(gameRow) {
        gameRow.setAttribute('invalid', '')
        setTimeout(() => {
            gameRow.removeAttribute('invalid', '')
        }, 600);
    }

    function displayMsg(message = 'Error', time = 5000, color = 'var(--full-modal-bkg-color)') {
        const msg = document.getElementById('msg')
        if (msg.querySelectorAll('.msg').length === 1) {
            msg.removeChild(msg.querySelector('.msg'))
        }
        const newMsg = document.createElement('div')

        newMsg.classList.add('msg')
        msg.appendChild(newMsg)
        newMsg.style.backgroundColor = color
        newMsg.innerText = message
        setTimeout(() => {
            newMsg.style.opacity = 1
            newMsg.style.transform = 'translateY(0)'
        }, 100);
        setTimeout(() => {
            newMsg.remove()
        }, time)
    }

    function evaluateGuess(guess, word) {
        const arr_guess = guess.split('')
        const arr_word = word.split('')
        const eval = [null, null, null, null, null]

        arr_guess.forEach((letter, i) => {
            if (letter === arr_word[i]) { // check for exact positions
                eval[i] = 'correct'
                arr_word[i] = '_'
            }
        })

        const arr_guess_set = Array.from(new Set(arr_guess))
        arr_guess_set.forEach((letter, i) => {
            if (arr_word.includes(letter)) { // check if the letter is in the word
                while (arr_word.indexOf(letter) !== -1){ // if it is, 
                    const index = arr_guess.indexOf(letter) // find the first occurence of the letter and 
                    if (!eval[index]) {
                        eval[index] = 'present' // mark it as present.
                    }
                    arr_word[arr_word.indexOf(letter)] = '_' // then remove that occurence from the word 
                    arr_guess[arr_guess.indexOf(letter)] = '_' // and the guess
                } // and keep checking until it's gone
            } else { // if neither present nor correct
                const index = arr_guess.indexOf(letter)
                if (!eval[index]) {
                    eval[index] = 'absent' // mark as absent
                }
            }
        })

        eval.forEach((e, i) => {
            if (!e) eval[i] = 'absent'
        })

        console.log(arr_word, arr_guess)
        return eval
    }

    helpBtn.addEventListener('click', () => {
        if (helpModal.classList.contains('open')) {
            helpModal.classList.remove('open')
        } else {
            helpModal.classList.add('open')
            exampleTiles.forEach(tile => {
                if (tile.getAttribute('data-state') !== 'tbd') {
                    flipTile(tile)
                }
            })
        }
    })
    // modalClose.addEventListener('click', () => {
    //     helpModal.classList.remove('open');
    //     setTimeout(() => {
    //         helpModal.style.display = 'none'
    //     }, 300);

    //     settingsModal.classList.remove('open');
    //     statsModal.classList.remove('open');
    // })

    /* Wordle Game */
    const word = await fetch('/get_word?lang=en').then(res => res.json()); // fetch word for the specific language
    const gameRows = document.querySelectorAll('game-row')

    if (!window.localStorage.getItem('boardState')) { // if there is no board state, create a new board
        window.localStorage.setItem('boardState', JSON.stringify({
            "boardState": ["", "", "", "", "", ""],
            "evaluations": [null, null, null, null, null, null],
            "rowIndex": 0,
            "hardMode": false,
            "nextWordTS": word.nextWordTS,
            'state': 'IN_PROGRESS'
        }))
    }
    let boardState = JSON.parse(window.localStorage.getItem('boardState')) // get the board state

    // check if it is a new day using the nextWordTS in localstorage
    if (boardState.nextWordTS !== word.nextWordTS) {
        // reset board state if it is not equal to the nextWordTS that was just fetched
        window.localStorage.setItem('boardState', JSON.stringify({
            "boardState": ["", "", "", "", "", ""],
            "evaluations": [null, null, null, null, null, null],
            "rowIndex": 0,
            "hardMode": false,
            "nextWordTS": word.nextWordTS,
            'state': 'IN_PROGRESS'
        }))
        return window.location.reload()
    }

    // load the board state into the game using the words stored and the evaluations
    boardState.boardState.forEach((word, i) => {
        if (word === '') return
        gameRows[i].setAttribute('letters', word)
        gameRows[i].querySelectorAll('game-tile').forEach((tile, j) => {
            tile.setAttribute('letter', word[j])
            tile.setAttribute('evaluation', boardState.evaluations[i][j])

            const divTile = tile.querySelector('.tile')
            divTile.innerText = word[j]
            divTile.setAttribute('data-state', boardState.evaluations[i][j])
            setTimeout(() => {
                flipTile(divTile)
            }, 200 + (j * 200));

        })
    })

    document.addEventListener('keydown', async (event) => {
        boardState = JSON.parse(window.localStorage.getItem('boardState')) // on every keypress, get the board state to make sure it is not stale data
        if (boardState.state === 'COMPLETED') return

        const rowIndex = boardState.rowIndex // get the word row they are on
        const gameRow = gameRows[rowIndex] // and get the row element from the index
        const gameTiles = gameRow.querySelectorAll('game-tile')
        const tiles = gameRow.querySelectorAll('.tile') // get all tiles from the row

        if ((event.key.length > 1 || !/^[A-Z]$/i.test(event.key)) && event.key !== 'Backspace' && event.key !== 'Enter') return // check if input is valid
        let currentLetters = gameRow.getAttribute('letters') // the letters that are currently in the row

        if (event.key === 'Backspace') { // if backspace is pressed, remove the last letter in the last tile
            if (currentLetters.length === 0) return
            gameRow.setAttribute('letters', currentLetters.slice(0, currentLetters.length - 1))
            currentLetters = gameRow.getAttribute('letters')
            tiles[currentLetters.length].setAttribute('data-state', 'empty')
            tiles[currentLetters.length].innerText = ''

            gameTiles[currentLetters.length].setAttribute('letter', '')

            popTile(tiles[currentLetters.length])
        } else if (event.key === 'Enter') { // if submitted
            if (currentLetters.length !== 5) { // check if there are even 5 letters in the row
                displayMsg('Not enough letters', 2000, 'var(--full-modal-bkg-color)')
                return shakeRow(gameRow)
            } else if (boardState.boardState.find(w => w === currentLetters)) {
                shakeRow(gameRow)
                return displayMsg('Word already used', 2000, 'var(--full-modal-bkg-color)')
            } else {
                const valid = await fetch('/validate_word?lang=en&word=' + currentLetters).then(res => res.json()); // if the word exists
                if (!valid) {
                    displayMsg('Invalid word', 2000, 'var(--full-modal-bkg-color)')
                    shakeRow(gameRow)
                } else {
                    const eval = evaluateGuess(currentLetters.toLowerCase(), word.word.toLowerCase()) // evaluate the guess
                    // push eval to board state and tiles, update boardstate words, and row index
                    boardState.boardState[rowIndex] = currentLetters
                    boardState.evaluations[rowIndex] = eval
                    boardState.rowIndex = rowIndex + 1
                    window.localStorage.setItem('boardState', JSON.stringify(boardState))

                    eval.forEach((evaluation, i) => { // update the tiles and animate them
                        setTimeout(() => {
                            tiles[i].setAttribute('data-state', evaluation)
                            flipTile(tiles[i])
                        }, 100 + i * 200);
                    })
                    // WIN
                    if (!eval.find(e => e === 'absent') && !eval.find(e => e === 'present')) { // there are only "correct" evaluations
                        boardState.state = 'COMPLETED'
                        window.localStorage.setItem('boardState', JSON.stringify(boardState))

                        eval.forEach((evaluation, i) => { // update the tiles and animate them
                            setTimeout(() => {
                                tiles[i].setAttribute('data-state', evaluation)
                                tiles[i].classList.add('win')
                            }, 1200 + (i * 200));
                        })

                        setTimeout(() => { // get random message from the map
                            const randomMsg = MESSAGES.get('en')[rowIndex][(Math.round(Math.random() * (MESSAGES.get('en')[rowIndex].length - 1)))]
                            displayMsg(randomMsg, 10000, 'var(--full-modal-bkg-color)')
                        }, 500 + (eval.length * 200))
                        return
                        // TODO: after the tiles bounce, display statistics from localstorage and update statistics with the win or lose
                    }
                    // LOSE
                    if (boardState.rowIndex === 6) {
                        boardState.state = 'COMPLETED'
                        window.localStorage.setItem('boardState', JSON.stringify(boardState))
                        setTimeout(() => {
                            displayMsg('You Lost :(', 10000, 'var(--full-modal-bkg-color)')
                        }, 200 + (eval.length * 200));
                        return
                    }
                }
            }
        } else {
            if (currentLetters.length === 5) return
            gameRow.setAttribute('letters', currentLetters + event.key)
            tiles[currentLetters.length].setAttribute('data-state', 'tbd')
            tiles[currentLetters.length].setAttribute('data-animation', 'pop')
            setTimeout(() => {
                tiles[currentLetters.length].setAttribute('data-animation', 'idle')
            }, 100);
            tiles[currentLetters.length].innerText = event.key

            gameTiles[currentLetters.length].setAttribute('letter', event.key)

            popTile(tiles[currentLetters.length])
        }
    })
})()