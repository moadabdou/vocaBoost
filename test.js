
class Obj{

    constructor (callback){
        this.fun1 
        this.fun2 
        callback(fun1, fun2)
    }

    then(fun1){
        this.fun1 =  fun1
        return this
    }

    catch(fun2){
        this.fun2 = fun2
    }

}

let  obj = new Obj((a,t)=> {
    a()
    t()
});

obj.then(h=> console.log(1)).catch(h=> console.log(2))