export default class Card {
    private suit: string;
    private value: number;

    public constructor(suits: string, value:number){
        this.suit = suits;
        this.value = value;
    }

    public cardToString() : string {
        return `${this.suit} ${this.getRoyalty(this.value)}`;
    }

    private getRoyalty(value: number): string {
        if(value === 11){
            return "J";
        } else if (value === 12){
            return "Q";
        } else if (value === 13){
            return "K";
        } else if (value === 1){
            return "A";
        } 
        return `${value}`;
    }

    public getCardImageCode = () => {
        console.log(`aaa ${this.suit}${this.value}.png`)
        return `${this.suit}${this.value}.png`
    }
}
