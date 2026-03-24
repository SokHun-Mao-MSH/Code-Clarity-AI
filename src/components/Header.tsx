import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Home, Code2, History, Settings2, Sun, Moon, X, Menu } from 'lucide-react';
import { cn } from "../utils";

interface HeaderProps {
  mainView: string;
  setMainView: (view: any) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  mainView, 
  setMainView, 
  darkMode, 
  setDarkMode, 
  isMenuOpen, 
  setIsMenuOpen 
}) => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
      <div className="w-full max-w-[1920px] mx-auto px-4 xl:px-8 h-20 flex items-center justify-between">
        {/* Left: Logo & App Name */}
        <div className="flex items-center gap-6">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setMainView('home')}
          >
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-shadow hover:shadow-[0_0_25px_rgba(16,185,129,0.8)]"
            >
              <BrainCircuit className="w-5 h-5 text-white dark:text-zinc-900" />
            </motion.div>
            <div className="flex flex-col">
              <motion.span 
                animate={{ 
                  color: ["#10b981", "#8b5cf6", "#3b82f6", "#10b981"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="font-black text-lg sm:text-xl md:text-2xl tracking-tighter text-zinc-900 dark:text-white leading-none uppercase truncate"
              >
                Code Clarity 
              </motion.span>
              <span className="text-[10px] md:text-xs text-emerald-500 font-black mt-1 uppercase tracking-[0.2em]">
                AI Assistant
              </span>
            </div>
          </motion.div>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'project', label: 'Code Explainer', icon: Code2 },
            { id: 'history', label: 'History', icon: History },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMainView(item.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-3 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-[13px] lg:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.12em] transition-all",
                mainView === item.id 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/70 dark:border-zinc-700/70" 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60"
              )}
            >
              <item.icon className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMainView('settings')}
            className={cn("p-2 rounded-lg transition-colors hidden md:block", mainView === 'settings' ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}
            title="Settings"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden md:block"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
