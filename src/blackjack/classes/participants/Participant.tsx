import Card from "../Card";

export default class Participant {
    protected hands: Card[] = [];

    public addCardToHand = (card: Card) => {
        this.hands.push(card);
    }

    public emptyHands = () => {
        this.hands = [];
    }

    public getHands = () => {
        // calculate counts aswel
        return this.hands
    }

    public handsToString = () => {
        let outpt = "";
        this.hands.forEach((card, index) => {    
            outpt += card.cardToString();
            if (index < this.hands.length - 1) {
                outpt += " - "
            }
        });

        return outpt;
    }

}