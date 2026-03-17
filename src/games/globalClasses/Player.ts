export default class Player {
    private name: string;
    private totalMoney: number;

    public constructor (name: string, startingBudget: number = 500){
        this.name = name;
        this.totalMoney = startingBudget;
    }
    
    public getName = () => {
        return this.name;
    }

    public getBalance() {
        return this.totalMoney;
    }


    public placeBet = (bet: number) => {
        if(bet <= this.totalMoney){
            this.totalMoney = this.totalMoney - bet;
        } else {
            alert('Not enough money to place this bet!')
        }
    }

    public earnMoney = (gain: number) => {
        this.totalMoney += gain;
    }

}