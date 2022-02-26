(() => {
    const keyboard = document.getElementById('keyboard');
    const keys = keyboard.querySelectorAll('button');
    keys.forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-key')
            const keyCode = btn.getAttribute('data-key').charCodeAt()

            document.dispatchEvent(new KeyboardEvent('keydown', {
                key,
                keyCode,
                bubbles: true,
                cancelable: true,
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                repeat: false,
            }));
        }
    })
})()