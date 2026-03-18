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
        return this.hand
    }

    public getHandValue = (): number => {
        let total = 0;
        let aces = 0;

        for (const card of this.hand) {
            total += card.getBlackjackValue();
            if (card.getBlackjackValue() === 11) aces++;
        }

        // convert Ace from 11 to 1 as long as bust
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    public isBust = (): boolean => {
        return this.getHandValue() > 21;
    }

    public isBlackjack = (): boolean => {
        return this.hand.length === 2 && this.getHandValue() === 21;
    }

    public handToString = () => {

        // return this.hand.map(c => c.cardToString()).join(" - ");
        
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