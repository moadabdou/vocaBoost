document.querySelector('button').onclick =  function () {
    if (document.querySelector('input').value){
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { message: document.querySelector('input').value});
        });
    }
}

document.getElementById('open-options').onclick = function(){
    chrome.runtime.openOptionsPage(function () {
        if (chrome.runtime.lastError){
            console.error(chrome.runtime.lastError);
        }
    });
}