'use client'
import Deck from "@/blackjack/classes/Deck";
import Card from "@/blackjack/classes/Card";
import BlackJackGame from "@/blackjack/BlackJackGame";



// const game = () => {
//     const deck : Deck = new Deck();
//     console.log(deck)

//     const card1 : Card = deck.getCard();
//     const card2 : Card = deck. getCard(); 
    
//     console.log(`Hand: ${card1.cardToString()} , ${card2.cardToString()} `);
// }


export default function Home() {
  return (
    <div>
     
     <BlackJackGame/>

    </div>
  );
}
