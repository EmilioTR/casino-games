import Card from "../Card"; 
import Player from "@/games/globalClasses/Player";

export default class BlackjackParticipant extends Player {
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