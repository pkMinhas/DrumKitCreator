const path = require('path')
const ejs = require('ejs')
const fs = require("fs")

// Render pads
function renderPad(samplepath,padnum,callback) {
  const sampleName = path.basename(samplepath)
  //only 16 pads considered
  const padNotes = [92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77]
  let templatePath = path.join(__dirname,'assets','ejs', 'pad.ejs')
  
  let samplePathHint = samplepath.split(path.sep).slice(1,-1)
  let padName = sampleName.replace('.wav','').replace('.WAV','').replace('.aiff','').replace('.AIFF','').replace('.mp3','').replace('.MP3','')

  ejs.renderFile(
    // Path to ejs file
    templatePath, 
    // Data for rendering
    { 
      SamplePathHint: samplePathHint,
      PadNumber: padnum,
      PadNote: padNotes[padnum],
      SampleName: sampleName,
      PadTitle: padName,
      SampleNameWithoutWav: padName
    },
    // callback with xml, or an error
    function (err, xml) {
      if (err) {
        console.log(err)
        return err
      }
        // console.log(xml)
        callback(xml)
      }
  )
}



function renderADGXML(samplePathArr,callback) {
  var finalXML = ''
  
  //Render head
  finalXML += fs.readFileSync(path.join(__dirname,"assets","ejs","adg-head.part.xml"), {encoding:"utf-8"})
  finalXML += '\n'

  //render first 16 pads
  for(var i=0; i<16; i++) {
    // If the pad is not empty
    if( samplePathArr[i] ) {
      const samplePath = samplePathArr[i]
      renderPad(samplePath,i, (xml) => finalXML += xml )
    }
    finalXML += '\n'
  }
  finalXML += '\n'
  
  // Render tail
  finalXML += fs.readFileSync(path.join(__dirname,"assets","ejs","adg-tail.part.xml"), {encoding:"utf-8"})
  callback(finalXML)
}

module.exports = { renderADGXML }
