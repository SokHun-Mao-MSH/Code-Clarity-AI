import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';

interface HeroProps {
  setMainView: (view: any) => void;
}

const Hero: React.FC<HeroProps> = ({ setMainView }) => {
  return (
    <div className="text-center space-y-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/20"
      >
        <Sparkles className="w-4 h-4" />
        Made For Beginners
      </motion.div>
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic z-10 relative flex flex-col items-center sm:items-start text-center sm:text-left">
          <motion.span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 dark:from-white dark:via-zinc-400 dark:to-white inline-block pb-2 whitespace-nowrap">
             Code Explainer
          </motion.span>
          <motion.span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-600 dark:from-emerald-400 dark:via-white dark:to-emerald-600 inline-block whitespace-nowrap">
             By AI For Beginners
          </motion.span>
        </h1>
        <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto z-10 relative">
          Paste your code below and let our intelligent AI explain it line-by-line, debug issues, or refactor it into clean, best-practice syntax.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
        <button 
          onClick={() => setMainView('project')}
          className="group relative overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-black px-10 py-5 xl:py-6 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center gap-3"
        >
          <Zap className="w-5 h-5 fill-current" />
          Start Learning
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Hero;
