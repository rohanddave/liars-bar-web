import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-8">
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-red-400 mb-4 drop-shadow-lg">
            Liar's Bar
          </h1>
          <p className="text-xl md:text-2xl text-red-200 mb-2">
            Where deception meets fun
          </p>
          <p className="text-lg text-red-300/80">
            Bluff, lie, and outsmart your opponents in this thrilling card game
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link 
            href="/login"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Play Now
          </Link>
          
          <Link 
            href="/rooms"
            className="bg-transparent border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-black font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105"
          >
            Browse Rooms
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-red-700/30">
            <div className="text-4xl mb-4">🃏</div>
            <h3 className="text-xl font-semibold text-red-300 mb-2">Strategic Gameplay</h3>
            <p className="text-red-200/80">Master the art of deception and read your opponents</p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-red-700/30">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-red-300 mb-2">Multiplayer Fun</h3>
            <p className="text-red-200/80">Play with friends or compete against players worldwide</p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-red-700/30">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-red-300 mb-2">Real-time Action</h3>
            <p className="text-red-200/80">Fast-paced rounds with instant results and reactions</p>
          </div>
        </div>

        <footer className="text-red-400/60 text-sm">
          © 2025 Liar's Bar. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
