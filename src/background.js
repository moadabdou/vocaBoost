// Function to convert image URL to Base64
async function convertImageToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    return null;
  }
}


// Function to open (or create) the database
function initializeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wordList', 1);
    // to do  : generate long id  
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // creating  myWords store 
      const objectStore = db.createObjectStore('myWords', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex("word", "word");

      //creating reviews  store  


      //creating progress  store 



      console.log('Object store created.');
    };

    request.onsuccess = (event) => {
      console.log('Database opened successfully.');
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      reject(event.target.error);
    };

  });
}


function checkWord(word){
  return new Promise((resolve ,  reject)=> {
     // Step 1: Open the database
    const request = indexedDB.open('wordList', 1);

    request.onsuccess = function(event) {
        const db = event.target.result;

        // Step 2: Start a transaction
        const transaction = db.transaction(['myWords'], 'readonly');
        
        // Step 3: Get the object store
        const store = transaction.objectStore('myWords');
        
        // Step 4: Use the index to search by 'word'
        const index = store.index('word'); 

        const query = index.get(word);

        // Step 5: Handle the result
        query.onsuccess = function() {
            if (query.result) {
                resolve(query.result)
            } else {
                resolve(false)
            }
        };

        query.onerror = function() {
            console.log('Error while searching for the word');
            reject(false);
        };
    };

    request.onerror = function() {
        console.log('Error opening the database');
        reject();
    };
  })
}


function setNewWord (wordData){
  return new Promise((resolve ,  reject)=> {
    // Open the database
    const request = indexedDB.open('wordList', 1);

    request.onsuccess = function(event) {
        const db = event.target.result;

        // Start a transaction
        const transaction = db.transaction(['myWords'], 'readwrite');
        const objectStore = transaction.objectStore('myWords');

        // Use the index to find the record by word
        const index = objectStore.index('word'); 

        const getRequest = index.get(wordData.word);

        getRequest.onsuccess = function() {
            if (getRequest.result) {
                getRequest.result.content =  wordData.content;
                getRequest.result.ts =  wordData.ts;
                objectStore.put(getRequest.result);
                resolve(true);
            } else {
                // Word does not exist, add it
                const addRequest = objectStore.add(wordData);
                
                addRequest.onsuccess = function() {
                    resolve(true)
                };

                addRequest.onerror = function(event) {

                    console.log(event)
                };
            }
        };

        getRequest.onerror = function(event) {
            console.log(event)
            console.error('Error retrieving word');
        };
    };

    request.onerror = function(event) {
        console.log(event)
        console.error('Error opening database:', event.target.error);
    };
 })
}

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    // Extension installed
    initializeDB();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated');
  }
});


function  fetchDB(date){
  return new Promise((resolve ,  reject)=> {
    // Step 1: Open the database
   const request = indexedDB.open('wordList', 1);

   request.onsuccess = function(event) {
       const db = event.target.result;

       // Step 2: Start a transaction
       const transaction = db.transaction(['myWords'], 'readonly');
       
       // Step 3: Get the object store
       const store = transaction.objectStore('myWords');
       
       if (date){
          // Open a cursor to iterate through the object store
          let wordAfterDate = [];
          let cursorRequest = store.openCursor();

          cursorRequest.onsuccess = function (event) {
              let cursor = event.target.result;
              if (cursor) {
                  let word = cursor.value;
                  if (word.ts > date) { 
                      wordAfterDate.push(word);
                  }
                  cursor.continue(); // Move to the next entry
              } else {
                  // No more entries
                  resolve(wordAfterDate);
              }
          };
          
          cursorRequest.onerror = function (event) {
              console.error('Error fetching data', event);
              reject();
          };
       }else {
          const query =  store.getAll();
          query.onsuccess = function() {
              resolve(query.result)
          };

          query.onerror = function() {
              console.log('Error while searching for the word');
              reject();
          };
        }
   };

   request.onerror = function() {
       console.log('Error opening the database');
       reject();
   };
 })
}

function  deleteDB(){
  return new Promise((resolve,  reject)=> {
    const storeName = 'myWords';
    const request = indexedDB.open('wordList', 1);

    request.onsuccess = function(event) {
      const db = event.target.result;
      const request = db.transaction(storeName, 'readwrite')
      .objectStore(storeName)
      .clear();

      request.onsuccess = ()=> {
        console.log(`Object Store "${storeName}" emptied`);
        resolve(`Object Store "${storeName}" emptied`);
      }

      request.onerror = (err)=> {
        console.error(`Error to empty Object Store: ${storeName}`)
        resolve(`Error to empty Object Store: ${storeName}`);
      }
    };
 
    request.onerror = function() {
      resolve(`Error to empty Object Store: ${storeName}`);
    }
  })
}
function deleteWord(wordId){
  return new Promise((resolve,  reject)=> {
    const request = indexedDB.open('wordList', 1);

    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction('myWords', 'readwrite'); 
      const store = transaction.objectStore('myWords');
    
      const request = store.delete(wordId);
    
      request.onsuccess = () => {
          resolve(`Record with id ${wordId} has been deleted.`);
      };
    
      request.onerror = (event) => {
          resolve('Error deleting record:', event);
      };
    };
 
    request.onerror = function() {
      resolve(`Error to delete the word`);
    }
  })

}

//message handeling 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convertToBase64') {
    convertImageToBase64(message.imageUrl).then(base64Image => {
      sendResponse({ base64Image });
    });// Required to use sendResponse asynchronously
  }
  if (message.action === 'CHECKWORD'){
    checkWord(message.data).then(res => {
      sendResponse(res)
    })
    
  }else if(message.action === 'NEWWORD'){
    setNewWord(message.data).then(res => {
      sendResponse(res);
    });
  }

  if (message.action ==  'FETCH'){
     fetchDB(message.date).then(res => {
      sendResponse(res);
     })
  }else if (message.action ==  'DELETE'){
    if (message.wordId){
      deleteWord(message.wordId).then(res => {
        sendResponse(res);
      });
    }else {
      deleteDB().then(res => {
        sendResponse(res);
      })
    }
  }

  return true;
});
