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

}