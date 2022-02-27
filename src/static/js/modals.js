(() => {
    const game = document.getElementById('game');
    const modalClose = document.querySelectorAll('.modal-close');
    const statsModal = document.getElementById('stats-modal');
    const helpModal = document.getElementById('help-modal');
    const settingsModal = document.getElementById('settings-modal')

    // implement stats button modal
    const statsBtn = document.getElementById('stats')
    const settingsBtn = document.getElementById('settings')

    const helpBtn = document.getElementById('help')
    const helpExamples = document.getElementById('help-examples');
    const exampleTiles = helpExamples.querySelectorAll('.tile')

    function flipTile(tile) {
        tile.setAttribute('data-animation', 'flip-in')
        setTimeout(() => {
            tile.setAttribute('data-animation', 'flip-out')
            setTimeout(() => {
                tile.setAttribute('data-animation', 'idle')
            }, 250);
        }, 250);
    }

    function closeModal(el) {
        el.classList.remove('open');
        game.classList.remove('hide')
        setTimeout(() => {
            el.style.display = 'none'
        }, 200);
    }

    helpBtn.addEventListener('click', () => {
        if (helpModal.classList.contains('open')) {
            closeModal(helpModal)
        } else {
            helpModal.style.display = 'flex'
            game.classList.add('hide')

            setTimeout(() => {
                helpModal.classList.add('open')
                exampleTiles.forEach(tile => {
                    if (tile.getAttribute('data-state') !== 'tbd') {
                        setTimeout(() => {
                            flipTile(tile)
                        }, 200);
                    }
                })
            }, 1);
        }
    })
    settingsBtn.addEventListener('click', () => {
        if (settingsModal.classList.contains('open')) {
            closeModal(settingsModal)
        } else {
            settingsModal.style.display = 'flex'
            game.classList.add('hide')

            setTimeout(() => {
                settingsModal.classList.add('open')
            }, 1);
        }
    })
    modalClose.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(helpModal)
            closeModal(settingsModal)
            closeModal(statsModal)
        })
    })

    const modeSelect = document.getElementById('modes-select')
    modeSelect.value = window.localStorage.getItem('mode') || 'en' // preload the mode

    modeSelect.addEventListener('change', () => {
        let lclstorageMode = window.localStorage.getItem('mode')
        if (lclstorageMode !== modeSelect.value) {
            window.localStorage.setItem('mode', modeSelect.value)
            window.location.reload()
        }
    })

    let boardState = JSON.parse(window.localStorage.getItem(modeSelect.value + '_boardState')) // get the board state
    const hardModeSwitch = document.getElementById('hard-mode-checkbox')

    hardModeSwitch.checked = boardState ? boardState.hardMode : false // load previous value

    hardModeSwitch.parentNode.addEventListener('click', () => {
        boardState = JSON.parse(window.localStorage.getItem(modeSelect.value + '_boardState'))
        if (boardState.rowIndex !== 0) {
            hardModeSwitch.checked = boardState.hardMode ? true : false
            hardModeSwitch.toggleAttribute('disabled', true)
            return
        } else {
            boardState.hardMode = hardModeSwitch.checked
            window.localStorage.setItem(modeSelect.value + '_boardState', JSON.stringify(boardState))
        }
    })
})()