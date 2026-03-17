//import Card from "../Card";
import Participant from "./Participant";

export default class Player extends Participant {
    
    private name: string;
    private totalMoney: number;

    public constructor (name: string, startingBudget: number = 500){
        super();
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