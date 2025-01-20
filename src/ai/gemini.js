


async function  gemini(API, example, word){

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='+API;
    const payload = {
        contents: [{
        parts: [{
            text: "write a definition  for the  word "+ word + " here is an example to follow : "+example 
        }]
        }]
    };
    
    try {
        const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        });
    
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    
        const data = await response.json();
        return  data.candidates[0].content.parts[0].text
    } catch (error) {
        return "error : an error  occured  while trying to  generate the defintion : " + error
    }

}

export default gemini


