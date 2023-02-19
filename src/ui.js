
//load output dir
window.api.getOutputDirectory().then(res => {
    document.getElementById("outputDir").innerText = res
})


document.getElementById('ipDir').addEventListener('click', async (evt) => {
    evt.preventDefault()
    res = await window.api.selectInputDirectory()
    document.getElementById("inputDir").innerText = res
})

document.getElementById('opDir').addEventListener('click', async (evt) => {
    evt.preventDefault()
    res = await window.api.selectOutputDirectory()
    document.getElementById("outputDir").innerText = res
})


document.getElementById('process').addEventListener('click', async (evt) => {
    evt.preventDefault()
    window.api.startProcessing()
})


require('electron').ipcRenderer.on('newMsg', (_, msg) => {
    document.getElementById("logs").innerText += "\n" + msg 
})