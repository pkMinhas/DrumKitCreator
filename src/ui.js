
//load output dir
window.api.getOutputDirectory().then(res => {
    document.getElementById("outputDir").innerText =  res
})


document.getElementById('selectExpansionDir').addEventListener('click', async (evt) => {
    evt.preventDefault()
    res = await window.api.selectInputDirectory()
    document.getElementById("expansionDir").innerHTML = res
})

document.getElementById('selectOutDir').addEventListener('click', async (evt) => {
    evt.preventDefault()
    res = await window.api.selectOutputDirectory()
    document.getElementById("outputDir").innerText = res
})


document.getElementById('process').addEventListener('click', async (evt) => {
    evt.preventDefault()
    //clear logs
    document.getElementById("logs").innerText = ""
    window.api.startProcessing()
})


require('electron').ipcRenderer.on('newMsg', (_, msg) => {
    document.getElementById("logs").innerText += "\n" + msg 
})