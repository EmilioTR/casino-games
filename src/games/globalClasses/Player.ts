export default class Player {
    private name: string;
    private totalMoney: number;
    private currentBet: number = 0;

    public constructor (name: string, startingBudget: number = 500){
        this.name = name;
        this.totalMoney = startingBudget;
    }
    
    public getName = () => this.name;
    public getBalance = () => this.totalMoney;
    public getCurrentBet = () => this.currentBet;

    public placeBet = (bet: number) => {
        if(bet <= this.totalMoney){
            this.currentBet = bet;
            this.totalMoney -=  bet;
        }
    }

    public dealerPayout = (bet: number) => {
            this.currentBet = bet;
            this.totalMoney -=  bet;
    }

    public winDoubleBet = () => {
        this.totalMoney += this.currentBet * 2;
        this.currentBet = 0;
    }

    public winTripleBet = () => {
        this.totalMoney += this.currentBet * 3;
        this.currentBet = 0;
    }

    public winBlackjack = () => {
        this.totalMoney += Math.floor(this.currentBet * 2.5);
        this.currentBet = 0;
    }

    public loseBet = () => {
        this.currentBet = 0;
    }

    public doubledCurrentBet = () => {
        this.currentBet *= 2;
    }

    public earnMoney = (gain: number) => {
        this.totalMoney += gain;
    }
}