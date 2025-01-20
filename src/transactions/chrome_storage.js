
import vcbLogging from '../helpers/logging'

const vcblog =  new vcbLogging();

export function addToChromeStorage(key, value, callback) {
    chrome.storage.local.set({ [key]: value }, function() {
        if (chrome.runtime.lastError) {
            vcblog.error('Error saving to storage: ', chrome.runtime.lastError);
            if (callback) callback(false); // Call the callback with false if there's an error
        } else {
            vcblog.log('Saved successfully! to storage');
            if (callback) callback(true); // Call the callback with true on success
        }
    });
}

export async function getFromChromeStorage(key) {
    return new Promise((resolve)=>{
        chrome.storage.local.get([key], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error reading from storage: ', chrome.runtime.lastError);
                resolve(null)
            } else {
                resolve(result[key])
            }
        });
    })
}