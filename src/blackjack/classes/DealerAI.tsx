import Card from "./Card";

export default class DealerAI {
    private hands: Card[] = [];

    public fillHand = (card: Card) => {
        this.hands.push(card);
    }

    // dealer AI logic incoming
}