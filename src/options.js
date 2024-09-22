import vcbLogging from './helpers/logging'
import wordTransactions from './transactions/wordtransaction';
import timeAgo from './helpers/timeAgo';
import {marked} from './tools/marked.min';

const vcblog =  new vcbLogging();
const wordtransactions = new  wordTransactions();



const  wordFilter = document.getElementById('wordFilter'), 
       wordsTable = document.querySelector('#wordTable tbody');


function  updateTable(words){
    wordsTable.innerHTML  =  '';    
    if  (words){
        words.forEach(word => {
            wordsTable.innerHTML +=  /*html*/ `
                <tr data-content='${word.content}'>
                    <td><input type="checkbox" class="selectWord" checked></td>
                    <td>${word.word}</td>
                    <td>${timeAgo(word.ts)}</td>
                    <td><button class="removeWord" data-word="${word.id}">Remove</button></td>
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


window.onload =  ()=> {
    fetchWords();
    showLastExport();
}

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
                text += `${wordrow.children[1].textContent}\t${marked(wordrow.getAttribute('data-content')).replace(/[\r\n]+/g, ' ')}\n`;
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