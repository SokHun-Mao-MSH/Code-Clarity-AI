import React from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Bug, Wand2, Code2, Layers3, Database } from 'lucide-react';
import { cn } from "../utils";

interface FeaturesProps {
  coreLanguages: string[];
  frameworkTags: string[];
  platformTags: string[];
}

const Features: React.FC<FeaturesProps> = ({ coreLanguages, frameworkTags, platformTags }) => {
  const features = [
    {
      title: 'Line-by-Line Explanation',
      desc: 'AI breaks down complex logic and syntax step-by-step for absolute beginners.',
      icon: BrainCircuit,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Smart Debugging',
      desc: 'Automatically parses error statements, identifies bugs, and provides fixed solutions with clear reasoning.',
      icon: Bug,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    {
      title: 'Code Refactoring',
      desc: 'Transforms inefficient code into clean architecture while explaining the best practices.',
      icon: Wand2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  const supportedInputCards = [
    {
      title: 'Programming Languages',
      desc: `${coreLanguages.length} options including JavaScript, TypeScript, Python, Java, C#, Dart, Go, Rust, SQL, and more.`,
      icon: Code2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Framework Tags',
      desc: `${frameworkTags.length} tags including React, Vue, Angular, Flutter, React Native, and Laravel.`,
      icon: Layers3,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Database / Platform Tags',
      desc: `${platformTags.length} option for database-style input such as MySQL query context.`,
      icon: Database,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 pt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">Core Capabilities</h2>
        <p className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">Everything you need to learn</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="card-enterprise p-8 md:p-10 space-y-6 group hover:border-emerald-500/50 transition-all border-zinc-200/50 dark:border-white/5"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", feature.bg)}>
              <feature.icon className={cn("w-7 h-7", feature.color)} />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{feature.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center space-y-4 pt-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">Supported Input</h2>
        <p className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">
          Supports {coreLanguages.length + frameworkTags.length + platformTags.length} input options
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {supportedInputCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="card-enterprise p-8 md:p-10 space-y-6 group hover:border-emerald-500/50 transition-all border-zinc-200/50 dark:border-white/5"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", card.bg)}>
              <card.icon className={cn("w-7 h-7", card.color)} />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{card.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Features;
