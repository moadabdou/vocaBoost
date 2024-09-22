//very  simple logging  algo

class vcbLogging {
    constructor(){
        this.addMsg = '[vocaBoost] :';
    }

    log(... logContent){
        console.log( this.addMsg , ...logContent)
    }
    error (... logContent){
        console.error(this.addMsg , ...logContent)
    }
}

export default vcbLogging;