import "./content.css"
import "./marked.css"



import floatingPanelState from './components/floatingPanelState'


function isSingleWord(text) {
  // This regex checks if the text contains only letters (a-z or A-Z) and is not empty
  const regex = /^[A-Za-z']+$/;
  return regex.test(text);
}

// Function to wrap selected text in a <span> with a class
function wrapSelectedText(selection ,range , selectedText) {

  const span = document.createElement('span');
  span.className = 'vocaBoost-highlighted-text'; 
  span.textContent = selectedText;
  range.deleteContents(); // Remove the selected text
  range.insertNode(span); // Insert the new <span> element

  selection.removeAllRanges(); // Clear the selection
}

//function to remove the span  from  every  other  words 
function removeSpan(){
  document.querySelectorAll('.vocaBoost-highlighted-text').forEach(el=> {
    el.parentNode.replaceChild(document.createTextNode(el.textContent) , el)
  }, )
}


//make  selection event work only  when  alt is pressed 
let  altPressed = false ;

document.addEventListener('keydown' , function(event){
  if (event.altKey){
    altPressed =  true;
  }
})

document.addEventListener('keyup' , function(event){
  if (!event.altKey){
    altPressed =  false;
  }
})


let  floatingpanelstate =  new floatingPanelState({afterClosing : removeSpan});

//event for selection mainly  for wraping data  and  dragging the floating panele
document.addEventListener( 'selectionchange' , function(){
  if (altPressed){
    let selection =  window.getSelection();
    if (selection.rangeCount){
      let rang = selection.getRangeAt(0);
      let  text =  rang.toString();

      // remove the span  from  every  other  words
      removeSpan();

      if (text.length>1 && isSingleWord(text)){
        wrapSelectedText(selection ,rang , text)
        floatingpanelstate.setWord(text.toLocaleLowerCase()); 
        floatingpanelstate.showPanel()
      }else {
        floatingpanelstate.hidePanel()
        console.log('false' , text) //to  set  an alert saying that this not a word 
      }
    }
  }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message.length>1 && isSingleWord(request.message)){
    floatingpanelstate.setWord(request.message.toLocaleLowerCase()); 
    floatingpanelstate.showPanel()
  }else {
    floatingpanelstate.hidePanel()
    console.log('false' , request.message) //to  set  an alert saying that this not a word 
  }
});