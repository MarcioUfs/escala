export class Queue{
    notificado: boolean = true;
    execute   : Function;
    time      : number;
    tamanho   : number = 0;
    limite    : number;
    id        : NodeJS.Timeout;
    constructor(time:number, limite:number){
        this.time = time;
        this.limite = limite
    }
    onNotify(execute: Function): Queue{
        this.execute = execute;
        return this;
    }
    notify(){
        this.notificado = true;
    }
    temVagas(): boolean{
        return this.tamanho < this.limite;
    }
    init(){
        this.id = setInterval( () => {
            if(this.notificado){
                this.execute()
                this.notificado = false;
            }}, this.time)
    }
    pop(){
        this.tamanho--;
        this.notify()
    }
    async push(execute:Function){
        this.tamanho++;
        this.notify();
        await execute(); 
        this.pop()
    }
    destroy(){
        clearInterval(this.id)
    }
}