import vcbLogging from "../helpers/logging";
const vcblog = new vcbLogging();

class wordTransactions  {
    constructor (){
        // to do 
    }

    checkWordExistence(word , callback){
        vcblog.log('checking existance  of this word ', word);
        chrome.runtime.sendMessage({
            action : 'CHECKWORD', 
            data :  word
        },  response => {
            vcblog.log('checking  response ', response)
            callback(response)
        });
    }

    setNewWord(wordData ,  callback){
        vcblog.log(`sending to set/update this word ` ,  wordData)

        wordData.ts = (new Date()).getTime();
        chrome.runtime.sendMessage({
            action : 'NEWWORD', 
            data :  wordData
        },  response => {
            vcblog.log('word updated !!' , response)
            callback(response)
        });
    }

    fetchWords (date , callback){

        vcblog.log('fetching words  after this time' ,  date ?  date :  'beginning');
        chrome.runtime.sendMessage({
            action : 'FETCH', 
            date ,
        },  response => {
            vcblog.log('fetched these words ' , response);
            callback(response);
        });
    }

    delete (wordId= null ,  callback){
        vcblog.log('[vocaBoost] :' ,  'sending message to empty db');
        chrome.runtime.sendMessage({
            action : 'DELETE',
            wordId
        },  response => {
            callback();
            vcblog.log( '[vocaBoost] :' ,response);
        });
    }


}


export default wordTransactions;


