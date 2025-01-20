
import wordTransactions from './transactions/wordtransaction';
import timeAgo from './helpers/timeAgo';
import {marked} from './tools/marked.min';
import { getFromChromeStorage, addToChromeStorage }  from  './transactions/chrome_storage'



const wordtransactions = new  wordTransactions();



const  wordFilter = document.getElementById('wordFilter'), 
       wordsTable = document.querySelector('#wordTable tbody');



function  updateTable(words){
    wordsTable.innerHTML  =  '';    
    if  (words){
        words.forEach(word => {
            wordsTable.innerHTML +=  /*html*/ `
                <tr >
                    <td><input type="checkbox" class="selectWord" checked></td>
                    <td>${word.word}</td>
                    <td>${timeAgo(word.ts)}</td>
                    <td><button class="removeWord" data-word="${word.id}">Remove</button></td>
                    <td id='word-content' style='display:none;'>${word.content}</td>
                </tr>
            `
        } );
        document.querySelectorAll('#wordTable tbody tr .removeWord').forEach(el=> {
            el.onclick = function() {
                wordtransactions.delete(Number(this.getAttribute('data-word')), ()=> {
                    this.parentElement.parentElement.remove(); // im laughing  while writing it 
                    if (wordsTable.childElementCount == 0 ){updateTable(null)}
                });
            };
        })
    }else {
        wordsTable.innerHTML +=  /*html*/ `
                <tr style='text-align:center' data-state='no words'>
                    <td>----</td>
                    <td >no words to  show </td>
                    <td>----</td>
                    <td>----</td>
                </tr>
            `
    }

}

function  fetchWords(){
    let  date =  null; 
    chrome.storage.sync.get('exportDate', (data) => {
        if ( wordFilter.value  ==  'lastExport' && data.exportDate) {
            date = data.exportDate;
        }
        wordtransactions.fetchWords(date , res=> {
            updateTable(res.length ? res  :  null ); // cuz  []  == true  in js 
        })
    });
}

function showLastExport(){
    chrome.storage.sync.get('exportDate',  (data)=> {
        if (data.exportDate){
            document.querySelector('#lastExportTime span ').textContent = new Date(data.exportDate).toLocaleString();
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    fetchWords();
    showLastExport();
});

wordFilter.onchange = fetchWords;

document.getElementById('removeAll').addEventListener('click' , ()=> {
    wordtransactions.delete(null , ()=> {
        updateTable(null);
    });
});

document.getElementById('searchBar').oninput =  function(){
    Array.from(wordsTable.children).forEach(wordrow  => {
        if (wordrow.children[1].textContent.startsWith(this.value.toLocaleLowerCase())){
            wordrow.style.display = '';
        }else {
            wordrow.style.display = 'none';
        }
    })
}

document.getElementById('exportWords').onclick = function(){
    if (! wordsTable.firstElementChild.getAttribute('data-state') ){
        let text =  ''; 
        Array.from(wordsTable.children).forEach(wordrow  => {
            if (wordrow.children[0].firstElementChild.checked){
                text += `${wordrow.children[1].textContent}\t${marked(wordrow.lastElementChild.innerHTML).replace(/[\r\n]+/g, ' ')}\n`;
            }
        })
        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'anki_cards'+new Date().toDateString() +'.txt';

        // Append the link, click it and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        chrome.storage.sync.set({exportDate:new Date().getTime()});
        showLastExport()
    }
}


function maskApiKey(apiKey) {
    const visibleLength = 5;
    const maskedPart = apiKey.length > visibleLength ? apiKey.slice(visibleLength).replace(/./g, '*') : '';
    const visiblePart = apiKey.slice(0, visibleLength);
  
    return `${visiblePart}${maskedPart}`;
}
  

function handleEditApiKey(event) {
    const modelElement = event.target.closest('.model')
    event.target.closest('.model')
    const editSection = modelElement.querySelector('.edit-api-key-section');
    const apiKeyInput = modelElement.querySelector('.api-key-input');

    // Extract key value and put it in the input field
    apiKeyInput.value = ''; 
    editSection.style.display = 'flex';  // Show the edit section
}

function handleSaveApiKey(event) {
    const modelElement = event.target.closest('.model')
    const apiKeyInput = modelElement.querySelector('.api-key-input').value;
    const apiKeyDisplay = modelElement.querySelector('.api-key-display');
    
    addToChromeStorage(event.target.closest('.model').querySelector('.model-name').textContent, apiKeyInput , res =>{
        if (res){
            apiKeyDisplay.innerText = `API Key: ${maskApiKey(apiKeyInput)}`;
            document.querySelector('.edit-api-key-section').style.display = 'none';  // Hide the edit section
        }
    })  
}

function handleCancelEdit(event) {
    const modelElement = event.target.closest('.model')
    modelElement.querySelector('.edit-api-key-section').style.display = 'none';  // Hide the edit section
}

  
function resetUseButtons() {
    // Get all the 'use-model-btn' buttons in the document
    const useButtons = document.querySelectorAll('.use-model-btn');

    // Loop through each button and change the text from "In Use" to "Use"
    useButtons.forEach(button => {
        button.textContent = 'Use'; 
    });
}

function handleUseModelButton(event) {
    addToChromeStorage('in-use-model', event.target.previousElementSibling.textContent, res => {
        if (res) {
            resetUseButtons();
            event.target.textContent = 'In Use';  // Change button text to "In Use"
        }
    });
}
  



function createModelElement(modelName, useText, apiKey) {
    // Create the model element from the string template
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="model">
        <div class="model-header">
          <span class="model-name">${modelName}</span>
          <button class="use-model-btn">${useText}</button>
        </div>
        <div class="api-key-section">
          <span class="api-key-display">API Key: ${maskApiKey(apiKey)}</span>
          <button class="edit-api-key-btn">Edit API Key</button>
        </div>
        <!-- API Key Edit Section (hidden by default) -->
        <div class="edit-api-key-section" style="display:none;">
          <input type="text" class="api-key-input" placeholder="Enter API Key">
          <button class="save-api-key-btn">Save</button>
          <button class="cancel-edit-btn">Cancel</button>
        </div>
      </div>
    `;
  
    return div.firstElementChild;  // Return the actual model div, not the wrapper
  }

async function  isUsed(model){
    return await getFromChromeStorage('in-use-model') ==  model
}

function appendModels(models) {
    // Select the container where the models will be appended
    const modelsContainer = document.querySelector('.llm-models');

  
    // Loop through the models array and create each model element
    models.forEach(async model => {
        const useText = await isUsed(model) ?  'in Use' :  'Use'
        const  res  =  await getFromChromeStorage(model)
        const apiKey = res ? res :  'NoAPI'
        // Create the model element using the createModelElement function
        const modelElement = createModelElement(model, useText, apiKey);
        modelElement.querySelector('.edit-api-key-btn').addEventListener('click', handleEditApiKey);
        modelElement.querySelector('.save-api-key-btn').addEventListener('click', handleSaveApiKey);
        modelElement.querySelector('.cancel-edit-btn').addEventListener('click', handleCancelEdit);
        modelElement.querySelector('.use-model-btn').addEventListener('click', handleUseModelButton);
        // Append the model element to the container
        modelsContainer.appendChild(modelElement);
    });

}
  

const models = ['GEMINI'];
  
// Call the function to append the models
window.onload = appendModels(models);

