import wordsExamples from './wordexamples'
import { getFromChromeStorage } from '../transactions/chrome_storage'

async function  getUserConfigs(callback){
    const modelName = await getFromChromeStorage('in-use-model')
    const modelAPI = await getFromChromeStorage(modelName)
    return callback({
        model : modelName,
        API : modelAPI,
        example: wordsExamples.defaulWordExample
    })
}

//temprary
export default getUserConfigs