import BlackJackGame from "@/games/blackjack/BlackJackGame";

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[url('/images/blackjackbg.jpeg')] bg-cover bg-center">
      <div className="flex w-full justify-center mt-10 ">
        <h1 className='text-3xl font-bold text-green-750 bg-green-950 rounded-2xl p-4 border-2 border-green-750'>BlackJack</h1>
      </div>
      <div className="flex flex-col justify-center items-center w-full">
        <BlackJackGame />
      </div>
    </div>
  );
}
