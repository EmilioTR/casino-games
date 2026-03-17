import Card from "../blackjack/classes/Card"; 

export default class Participant {
    protected hand: Card[] = [];

    public addCardToHand = (card: Card) => {
        this.hand.push(card);
    }

    public emptyHand = () => {
        this.hand = [];
    }

    public getHand = () => {
        // calculate counts aswel
        return this.hand
    }

    public handToString = () => {
        let outpt = "";
        this.hand.forEach((card, index) => {    
            outpt += card.cardToString();
            if (index < this.hand.length - 1) {
                outpt += " - "
            }
        });

        return outpt;
    }

    

}