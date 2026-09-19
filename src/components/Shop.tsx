import { useState } from 'react';
import { UserProfile } from '../types';
import { ShoppingCart, Zap, Check } from 'lucide-react';

interface ShopProps {
  user: UserProfile;
}

export default function Shop({ user }: ShopProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  const packs = [
    { id: 'p1', title: '800 CPM Boost Credits', price: 'Tk 20', desc: '800 CPM Boost Credits. You can earn 1 usd approximately.' },
    { id: 'p2', title: '2000 CPM Boost Credits', price: 'Tk 50', desc: '2000 CPM Boost Credits. You can earn 3 usd approximately.' },
    { id: 'p3', title: '4000 CPM Boost Credits', price: 'Tk 100', desc: '4000 CPM Boost Credits. You can earn 7 usd approximately.' },
    { id: 'p4', title: '9000 CPM Boost Credits', price: 'Tk 200', desc: '9000 CPM Boost Credits. You can earn 1 usd approximately.' },
    { id: 'p5', title: '15000 CPM Boost Credits', price: 'Tk 300', desc: '15000 CPM Boost Credits.' },
    { id: 'p6', title: '25000 CPM Boost Credits', price: 'Tk 500', desc: '25000 CPM Boost Credits. Auto-visits powered by our server fleet.' },
  ];

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Shop Header Banner */}
      <div className="bg-[#18153b] rounded-[2rem] p-6 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900/80 flex items-center justify-center border border-indigo-700/50">
            <ShoppingCart className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Shop & Boost Traffic</h2>
            <p className="text-xs text-indigo-300 font-medium">Accelerate your traffic and CPM yields</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-900/40 text-center">
            <span className="text-[11px] uppercase font-bold text-indigo-300">Impressions</span>
            <p className="text-lg font-black text-white mt-1">41,656</p>
          </div>
          <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-900/40 text-center">
            <span className="text-[11px] uppercase font-bold text-indigo-300">Credits</span>
            <p className="text-lg font-black text-cyan-400 mt-1">0</p>
          </div>
          <div className="bg-indigo-950/60 rounded-2xl p-4 border border-indigo-900/40 text-center">
            <span className="text-[11px] uppercase font-bold text-indigo-300">Products</span>
            <p className="text-lg font-black text-purple-400 mt-1">14</p>
          </div>
        </div>
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => (
          <div 
            key={pack.id} 
            onClick={() => setSelectedPack(pack.id)}
            className={`bg-[#18153b] rounded-3xl p-5 border transition-all cursor-pointer relative overflow-hidden ${
              selectedPack === pack.id ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-indigo-900/50 hover:border-indigo-700'
            }`}
          >
            <div className="absolute top-4 right-4 bg-indigo-900/80 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-700/50">
              CPM Boost
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center mb-3 border border-indigo-800/50">
              <Zap className="w-5 h-5 text-amber-400 fill-current" />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">{pack.title}</h3>
            <p className="text-xs text-indigo-300 mb-4 leading-relaxed">{pack.desc}</p>
            <div className="flex items-center justify-between pt-3 border-t border-indigo-900/40">
              <span className="text-xl font-black text-emerald-400">{pack.price}</span>
              <button className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
