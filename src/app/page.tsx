'use client'

import Deck from "@/blackjack/classes/Deck";
import Card from "@/blackjack/classes/Card";



const game = () => {
    const deck : Deck = new Deck();
    console.log(deck)

    const card1 : Card = deck.getCard();
    const card2 : Card = deck. getCard(); 
    
    console.log(`Hand: ${card1.cardToString()} , ${card2.cardToString()} `);
}


export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
     <button onClick={game} >play</button>

    </div>
  );
}
