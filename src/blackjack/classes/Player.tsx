import Card from "./Card";

export default class Player {
    
    private name: string;
    private hands: Card[] = [] ;
    private totalMoney: number = 500;

    public constructor (name: string){
        this.name = name;
    }
    
    public getName = () => {
        return this.name;
    }

    public fillHand = (card: Card) => {
        this.hands.push(card);
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