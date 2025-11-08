import Card from "./Card";

export default class Deck {
    private deck: Card[];

    public constructor(){
        this.deck = this.generateDeck();
    }

    public getCard() : Card {
        return this.deck.pop()!;
    }

    public generateDeck() : Card[] {
        const deck : Card[] = [];
       // const suits: string[] = ["♠","♣","♦","♥"];
        const suits: string[] = ["S","C","D","H"];
        const numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

        for (const suit of suits) {
            for (const number of numbers){
                const kaart = new Card(suit, number);
                deck.push(kaart)
            }
        } 

        return this.fisherYatesShuffleAlgorithm(deck);
    }

    public fisherYatesShuffleAlgorithm(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

}
