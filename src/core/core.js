//Convention based logic for copying data from MPC expansions to Ableton Drum Racks
const fs = require("fs")
const xml2js = require('xml2js')
const path = require('path')
const { renderADGXML } = require("./renderAdgFile")

//xpm file is just a xml 
//callback will have err, progName, array of array of samples
let readXPMAsync = (filepath) => {
    let promise = new Promise(async (resolve, reject) => {
        try {
            let xmlStr = await fs.promises.readFile(filepath, { encoding: "utf-8" })
            const xmlParser = new xml2js.Parser({ ignoreAttrs: false, mergeAttrs: true })
            xmlParser.parseString(xmlStr, (err, result) => {
                if (err != null) {
                    reject(err)
                    return
                }
                let programArr = result.MPCVObject.Program
                for (var index = 0; index < programArr.length; index++) {
                    const program = programArr[index]
                    var result = null
                    if (program.type == "Drum") {
                        let programName = program.ProgramName[0]
                        console.log(`Found a Drum program named ${programName}`)
                        //all samples are in the instruments section
                        let instruments = (program.Instruments)[0].Instrument
                        // console.log(`Total instruments ${instruments.length}`)
                        var entries = []
                        instruments.forEach((instrument) => {
                            var samples = []
                            //extract layers and samples associated with them
                            let allLayers = instrument.Layers[0].Layer
                            allLayers.forEach(instrLayer => {
                                let sampleName = instrLayer.SampleName[0]
                                if (sampleName.trim() != "") {
                                    samples.push(sampleName)
                                }
                            })
                            if (samples.length > 0) {
                                entries.push(samples)
                            }
                        })
                        //found our drum program, exit the loop
                        result = {
                            programName: programName,
                            entries: entries
                        }
                        break
                    }
                }
                if (result) {
                    resolve(result)
                } else {
                    reject("No drum program found!")
                }
            })
        } catch (err) {
            reject(err)
        }
    })

    return promise
}

//returns array of xpm paths
const findXPM = (dirPath) => {
    let dirResult = fs.readdirSync(dirPath)
    let files = dirResult.filter(filename => {
        return !filename.startsWith(".") && filename.endsWith(".xpm")
    })
    console.log(`Found ${files.length} xpm files`)
    let res = []
    files.forEach(name => {
        res.push(path.join(dirPath, name))
    })
    return res
}


/**
 * 
 * @param {*} inputDir 
 * @param {*} outputDir 
 * @param {*} progressCallback callback with string for progress messages 
 */
let renderADGAsync = async (inputDir, outputDir, progressCallback) => {
    return new Promise((resolve, reject) => {
        var mpcExpansionDir = inputDir
        if (!mpcExpansionDir.endsWith(path.sep)) {
            mpcExpansionDir += path.sep
        }

        let expansionName = mpcExpansionDir.split(path.sep)[mpcExpansionDir.split(path.sep).length - 2]
        progressCallback(`Expansion ${expansionName}`)
        let outputAdgDir = path.join(outputDir, expansionName)
        if (!fs.existsSync(outputAdgDir)) {
            fs.mkdirSync(outputAdgDir, { recursive: true })
        }
        progressCallback(`Created output directory: ${outputAdgDir}`)
        progressCallback(`Copying previews`)
        ////since there is no reliable way of adding preview to drum racks, we just copy the preview folder to the library folder 
        fs.cpSync(path.join(mpcExpansionDir, "[Previews]"), path.join(outputAdgDir, "Previews"), { recursive: true })
        progressCallback("Previews copied")

        let xpmPaths = findXPM(mpcExpansionDir)
        let totalKitCount = xpmPaths.length
        progressCallback(`Found ${totalKitCount} kits`)

        //counter for async processing handling
        var kitsProcessed = 0
        xpmPaths.forEach(async xpm => {
            try {
                let { programName, entries } = await readXPMAsync(xpm)

                //create a dir with prog name
                let adgPath = path.join(outputAdgDir, programName + ".adg")
                let sampleOutputDir = path.join(outputAdgDir, "samples", programName)
                if (!fs.existsSync(sampleOutputDir)) {
                    await fs.promises.mkdir(sampleOutputDir, { recursive: true })
                }

                //copy all samples
                progressCallback(`Copying samples for xpm ${xpm.split(path.sep).pop()}`)
                var samplePathArr = []
                entries.forEach(entry => {
                    entry.forEach(async sampleName => {
                        //by convention, the mpc expansions have filename with extension .WAV
                        let samplePath = path.join(mpcExpansionDir, sampleName + ".WAV")
                        let destPath = path.join(sampleOutputDir, sampleName + ".WAV")
                        await fs.promises.cp(samplePath, destPath)
                        samplePathArr.push(destPath)
                    })
                })

                //render the ADG file
                renderADGXML(samplePathArr, async (xml) => {
                    await fs.promises.writeFile(adgPath, xml)
                    progressCallback(`${adgPath.split(path.sep).pop()} created`)
                    kitsProcessed++
                    if(kitsProcessed == totalKitCount) {
                        resolve()
                    }
                })

            } catch (err) {
                progressCallback(`Error processing ${xpm}: ${err}`)
                kitsProcessed++
                if(kitsProcessed == totalKitCount) {
                    resolve()
                }
            }
        })
    })

}

module.exports = {
    renderADGAsync
}