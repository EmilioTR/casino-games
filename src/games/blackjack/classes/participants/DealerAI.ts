import Deck from "../Deck";
import BlackjackParticipant from "./BlackjackParticipant";

export default class DealerAI extends BlackjackParticipant {
    constructor(playerCount: number) {
        super("Dealer", 2000 * playerCount);
    }

    public playTurn = (deck: Deck): void => {
        while (this.getHandValue() < 17) {
            this.addCardToHand(deck.getCard());
        }

        if (this.getHandValue() >= 17 && this.getHandValue() <= 19) {
            if (Math.random() < 1 / 5) {
                this.addCardToHand(deck.getCard());
            }
        }
    }
}