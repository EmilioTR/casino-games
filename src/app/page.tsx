import BlackJackGame from "@/games/blackjack/BlackJackGame";

import PlinkoGame from "@/games/plinkoballs/PlinkoGame";
import ToggleGameButton from "@/games/globalClasses/ToggleGameButton";
export default function Home() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-[url('/images/blackjackbg.jpeg')] bg-cover bg-center bg-fixed">

      {/* Dark overlay to deepen the background */}
      <div className="fixed inset-0 bg-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col items-center w-full py-10 gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500/70">Welcome to</p>
          <h1
            className="text-5xl font-black text-amber-300 tracking-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.3)]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Casino Night
          </h1>
          {/* Decorative gold line under title */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-1" />
        </div>

        {/* Game */}

        <ToggleGameButton/>
        {/* <BlackJackGame />


        <PlinkoGame/> */}

        {/* Footer */}
        <p className="text-zinc-600 text-xs tracking-widest uppercase pb-4">
          For gambling use only · No real money involved but a hell lot of fun!
        </p>

      </div>
    </div>
  );
}
