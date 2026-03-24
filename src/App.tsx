import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Code2, 
  Sparkles, 
  Terminal, 
  ChevronRight, 
  Copy, 
  Plus,
  History,
  Layout,
  FileCode,
  Trash2,
  Menu,
  X,
  Home,
  CheckCircle2,
  Sun,
  Moon,
  Box,
  Zap,
  Clock,
  Wand2,
  Bug,
  BrainCircuit,
  ArrowRight,
  Globe2,
  Settings2,
  Trash,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, ensureDate } from "./utils";
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { Project } from "./types";

// Extracted Components
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'html', 'css', 
  'php', 'laravel', 'c#', 'cpp', 'c', 'mysql', 'sql', 'dart', 'kotlin', 'swift', 'flutter', 'react', 'react native', 'vue', 'angular', 'go', 'rust', 'json'
];

const OUTPUT_LANGUAGES = [
  'English', 'Khmer'
];

// Fallback API URL used when production env vars are missing or invalid.
const DEFAULT_PROD_API_URL = 'https://code-clarity-api.onrender.com';
const resolveApiBaseUrl = (): string => {
  const sanitize = (value: string) => value.replace(/\/+$/, '');
  const devApiUrl = sanitize(import.meta.env.VITE_API_URL_DEV?.trim() || '');
  const prodApiUrl = sanitize(import.meta.env.VITE_API_URL?.trim() || '');
  const prodFallbackApiUrl = sanitize(import.meta.env.VITE_API_URL_FALLBACK?.trim() || DEFAULT_PROD_API_URL);

  const isLocalhost = typeof window !== 'undefined'
    && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

  // In local testing, prefer explicit dev override; otherwise use same-origin backend.
  if (isLocalhost) {
    return devApiUrl || '';
  }

  const candidate = prodApiUrl || prodFallbackApiUrl;
  const isLikelyFirebaseHost = /web\.app|firebaseapp\.com/i.test(candidate);
  const isSameOrigin = typeof window !== 'undefined' && candidate === window.location.origin;

  // Never call Firebase hosting as API backend in production.
  if (isLikelyFirebaseHost || isSameOrigin) {
    return prodFallbackApiUrl;
  }

  return candidate;
};

const MAX_IMAGE_DIMENSION = 1600;
const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_BASE64_LENGTH = 8_500_000;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const LANGUAGE_NORMALIZATION: Record<string, string> = {
  'c#': 'csharp',
  cpp: 'cpp',
  mysql: 'sql',
  react: 'javascript',
  'react native': 'javascript',
  vue: 'javascript',
  angular: 'javascript',
  laravel: 'php',
  flutter: 'dart',
};

const LANGUAGE_OPTION_FROM_DETECTED: Record<string, string> = {
  csharp: 'c#',
  cpp: 'cpp',
  sql: 'sql',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  php: 'php',
  go: 'go',
  rust: 'rust',
  html: 'html',
  css: 'css',
  json: 'json',
  kotlin: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  c: 'c',
};

const normalizeLanguage = (lang: string): string => LANGUAGE_NORMALIZATION[lang] || lang;

const detectCodeLanguage = (code: string): string | null => {
  const trimmed = code.trim();
  if (!trimmed) return null;

  try {
    JSON.parse(trimmed);
    return 'json';
  } catch {
    // Not JSON; continue heuristics.
  }

  const patterns: Record<string, RegExp[]> = {
    python: [/\bdef\s+\w+\s*\(/, /\bprint\s*\(/, /\bimport\s+\w+/, /\bNone\b/, /\belif\b/],
    typescript: [/\binterface\s+\w+/, /\btype\s+\w+\s*=/, /:\s*(string|number|boolean|any|unknown)\b/, /\bimplements\b/],
    javascript: [/\bfunction\s+\w+\s*\(/, /\bconsole\.log\s*\(/, /\b(const|let|var)\s+\w+/, /=>/, /\b(document|window)\./],
    java: [/\bpublic\s+class\s+\w+/, /\bpublic\s+static\s+void\s+main\b/, /\bSystem\.out\.println\s*\(/],
    csharp: [/\busing\s+System\b/, /\bnamespace\s+\w+/, /\bConsole\.WriteLine\s*\(/],
    cpp: [/#include\s*</, /\bstd::\w+/, /\bcout\s*<</, /\bcin\s*>>/],
    c: [/#include\s*</, /\bprintf\s*\(/, /\bscanf\s*\(/],
    php: [/<\?php/, /\$\w+/, /\becho\b/, /->\w+/],
    go: [/\bpackage\s+main\b/, /\bfunc\s+\w+\s*\(/, /\bfmt\.Println\s*\(/],
    rust: [/\bfn\s+main\s*\(/, /\blet\s+mut\b/, /\bprintln!\s*\(/],
    html: [/<!DOCTYPE html>/i, /<html[\s>]/i, /<div[\s>]/i, /<script[\s>]/i],
    css: [/[.#]?\w[\w-]*\s*\{[^}]*:[^}]*\}/, /@media\s*\(/, /@keyframes\s+/],
    sql: [/\bSELECT\b[\s\S]*\bFROM\b/i, /\bINSERT\s+INTO\b/i, /\bUPDATE\b[\s\S]*\bSET\b/i, /\bDELETE\s+FROM\b/i],
    kotlin: [/\bfun\s+\w+\s*\(/, /\bval\s+\w+/, /\bvar\s+\w+/, /\bprintln\s*\(/],
    swift: [/\bfunc\s+\w+\s*\(/, /\blet\s+\w+/, /\bvar\s+\w+/, /\bprint\s*\(/],
    dart: [/\bvoid\s+main\s*\(/, /\bfinal\s+\w+/, /\bString\s+\w+/, /\bprint\s*\(/],
  };

  let bestMatch: { language: string; score: number } = { language: '', score: 0 };

  Object.entries(patterns).forEach(([languageName, regexes]) => {
    const score = regexes.reduce((acc, regex) => (regex.test(trimmed) ? acc + 1 : acc), 0);
    if (score > bestMatch.score) {
      bestMatch = { language: languageName, score };
    }
  });

  return bestMatch.score >= 2 ? bestMatch.language : null;
};


interface CustomDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon?: React.ElementType;
}

const CustomDropdown = ({ value, options, onChange, icon: Icon }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-enterprise flex items-center justify-between w-full text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />}
          <span className="truncate capitalize">{value}</span>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 text-zinc-400 transition-transform duration-200",
          isOpen ? "rotate-90" : "rotate-0"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30 overflow-hidden py-1.5"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors capitalize",
                    value === option 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [inputCode, setInputCode] = useState('// Paste your code here to begin\n\nfunction helloWorld() {\n  console.log("Welcome to Code Clarity AI!");\n}');
  
  // Settings States
  const [language, setLanguage] = useState(() => localStorage.getItem('defaultLang') || 'javascript');
  const [outputLanguage, setOutputLanguage] = useState(() => localStorage.getItem('defaultOutLang') || 'English');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  const [explanationResult, setExplanationResult] = useState('');
  const [projectName, setProjectName] = useState('Untitled Snippet');
  const [loading, setLoading] = useState(false);
  const [actionStep, setActionStep] = useState<string>('');
  
  const [mainView, setMainView] = useState<'home' | 'project' | 'history' | 'settings'>('home');
  
  // Vision States
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [init, setInit] = useState(false);
  const [copied, setCopied] = useState(false);
  const isKhmerOutput = outputLanguage === 'Khmer' || /[\u1780-\u17FF]/.test(explanationResult);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {};

  // Load history from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('ccai_history');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (error) {
        console.error("Failed to parse history:", error);
      }
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync Settings changes
  useEffect(() => { localStorage.setItem('defaultLang', language); }, [language]);
  useEffect(() => { localStorage.setItem('defaultOutLang', outputLanguage); }, [outputLanguage]);

  const saveHistory = (newProject: Project) => {
    let updatedProjects = [...projects];
    const existingIndex = updatedProjects.findIndex(p => p.id === newProject.id);
    
    if (existingIndex >= 0) {
      updatedProjects[existingIndex] = newProject;
    } else {
      updatedProjects = [newProject, ...updatedProjects];
    }
    
    setProjects(updatedProjects);
    localStorage.setItem('ccai_history', JSON.stringify(updatedProjects));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to permanently delete all saved history?')) {
       setProjects([]);
       localStorage.removeItem('ccai_history');
    }
  };

  const handleAction = async (actionType: 'Explain' | 'Debug' | 'Refactor' | 'Generate') => {
    if (!inputCode.trim()) return;
    const detectedLanguage = detectCodeLanguage(inputCode);
    const normalizedSelectedLanguage = normalizeLanguage(language);
    let requestLanguage = language;

    if (detectedLanguage && detectedLanguage !== normalizedSelectedLanguage) {
      const correctedOption = LANGUAGE_OPTION_FROM_DETECTED[detectedLanguage];
      if (correctedOption && correctedOption !== language) {
        setLanguage(correctedOption);
        requestLanguage = correctedOption;
        setActionStep(`Detected ${correctedOption.toUpperCase()} from code, language updated automatically.`);
      }
    }

    setLoading(true);
    
    setExplanationResult('');
    
    const stepsOptions = {
      'Explain': [
        "Analyzing Code Structure...",
        "Identifying Key Concepts...",
        "Breaking Down Logic Step-by-Step...",
        "Generating Beginner-Friendly Explanation..."
      ],
      'Debug': [
        "Scanning Code for Errors...",
        "Identifying Bug Origins...",
        "Formulating Precise Fixes...",
        "Preparing Corrected Code & Explanation..."
      ],
      'Refactor': [
        "Analyzing Code Architecture...",
        "Applying Professional Standards...",
        "Optimizing for Maintainability...",
        "Generating Clean & Efficient Syntax..."
      ]
    };
    
    setActionStep(actionType === 'Explain' ? 'Explaining...' : actionType === 'Debug' ? 'Debugging...' : 'Refactoring...');
    
    const steps = stepsOptions[actionType];
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setActionStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1500);

    try {
      const apiUrl = resolveApiBaseUrl();
      const endpoint = apiUrl ? `${apiUrl}/api/explain` : '/api/explain';
      console.log('API Request URL:', endpoint); // DEBUG: Check this in Chrome Console (F12)

      if (import.meta.env.PROD && !apiUrl) {
        throw new Error('VITE_API_URL is not configured for production.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputCode,
          language: requestLanguage,
          outputLanguage,
          actionType,
          imageData: selectedImage?.data,
          mimeType: selectedImage?.mimeType
        }),
      });
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMessage = 'Network response was not ok';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          if (contentType.includes('text/html')) {
            errorMessage = 'API returned HTML instead of JSON. Please check VITE_API_URL points to your Render backend.';
          }
        }
        throw new Error(errorMessage);
      }

      if (!contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response. Please verify VITE_API_URL is your backend URL, not Firebase Hosting URL.');
      }

      const data = await response.json();
      const text = data.result || '';
      
      clearInterval(stepInterval);
      setActionStep(`${actionType} Complete`);
      setExplanationResult(text);

      const projectData: Project = {
        id: currentProject?.id || Date.now().toString(),
        name: projectName || 'Untitled Snippet',
        description: inputCode,
        language: requestLanguage,
        outputLanguage: outputLanguage,
        scope: actionType,
        generatedCode: text,
        createdAt: currentProject?.createdAt || Date.now()
      };

      saveHistory(projectData);
      setCurrentProject(projectData);

      // Timeout allows smooth scrolling on mobile
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error("Action failed:", error);
      setActionStep('Operation Failed');
      let details = error instanceof Error ? error.message : 'Unknown error';
      
      if (details === 'Failed to fetch') {
         details = 'Could not connect to server. Check if the Backend URL is correct and the server is running (Render free tier may take 1 minute to wake up).';
      }
      
      setExplanationResult(`Sorry, an error occurred while processing your request: ${details}`);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(explanationResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setInputCode(project.description || ''); 
    setExplanationResult(project.generatedCode || '');
    setLanguage(project.language || localStorage.getItem('defaultLang') || 'javascript');
    setOutputLanguage(project.outputLanguage || localStorage.getItem('defaultOutLang') || 'English');
    setMainView('project');
  };

  const handleNewProject = () => {
    setCurrentProject(null);
    setProjectName('New Snippet');
    setInputCode('');
    setExplanationResult('');
    setMainView('project');
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this snippet?')) {
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);
      localStorage.setItem('ccai_history', JSON.stringify(updatedProjects));
      if (currentProject?.id === id) {
        handleNewProject();
      }
    }
  };

  const readAsDataUrl = (file: File): Promise<string> => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    })
  );

  const loadImage = (dataUrl: string): Promise<HTMLImageElement> => (
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to decode the image.'));
      image.src = dataUrl;
    })
  );

  const compressImageToJpeg = async (dataUrl: string): Promise<{ data: string; mimeType: string }> => {
    const image = await loadImage(dataUrl);

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to process image. Browser canvas is unavailable.');
    }

    context.drawImage(image, 0, 0, width, height);

    const qualitySteps = [0.9, 0.82, 0.74, 0.66];
    for (const quality of qualitySteps) {
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = compressedDataUrl.split(',')[1] || '';
      if (base64.length <= MAX_IMAGE_BASE64_LENGTH) {
        return { data: base64, mimeType: 'image/jpeg' };
      }
    }

    const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.6);
    return { data: fallbackDataUrl.split(',')[1] || '', mimeType: 'image/jpeg' };
  };

  const processImageFile = async (file: File): Promise<{ data: string; mimeType: string }> => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Unsupported image type. Please upload PNG, JPG, or WEBP.');
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      throw new Error('Image is too large. Please upload an image smaller than 15MB.');
    }

    const dataUrl = await readAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const base64 = dataUrl.split(',')[1] || '';

    const needsCompression = (
      file.size > 3 * 1024 * 1024
      || image.width > MAX_IMAGE_DIMENSION
      || image.height > MAX_IMAGE_DIMENSION
      || base64.length > MAX_IMAGE_BASE64_LENGTH
    );

    const processedImage = needsCompression
      ? await compressImageToJpeg(dataUrl)
      : { data: base64, mimeType: file.type };

    if (!processedImage.data || processedImage.data.length > MAX_IMAGE_BASE64_LENGTH) {
      throw new Error('Image is still too large after optimization. Please crop or resize it and try again.');
    }

    return processedImage;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError('');

    try {
      const processedImage = await processImageFile(file);
      setSelectedImage(processedImage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image.';
      setImageUploadError(message);
      setSelectedImage(null);
    } finally {
      // Allow selecting the same file again after an error.
      e.target.value = '';
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setImageUploadError('');

    try {
      const processedImage = await processImageFile(file);
      setSelectedImage(processedImage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image.';
      setImageUploadError(message);
      setSelectedImage(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };


  const particlesOptions = useMemo(() => ({
    fpsLimit: 120,
    interactivity: {
      detectsOn: "window",
      events: {
        onHover: {
          enable: true,
          mode: "repulse",
        },
        onClick: {
          enable: true,
          mode: "push",
        }
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
        push: {
          quantity: 4,
        },
      },
    },
    particles: {
      color: {
        value: darkMode ? "#10b981e4" : "#059668cf",
      },
      links: {
        color: darkMode ? "#34d399" : "#10b981",
        distance: 150,
        enable: true,
        opacity: darkMode ? 0.8 : 0.6,
        width: 1.5,
      },
      move: {
        enable: true, // Re-enabled as requested
        speed: 1.2,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "bounce",
        },
      },
      number: {
        density: {
          enable: true,
          width: 800,
          height: 800,
        },
        value: 60,
      },
      opacity: {
        value: darkMode ? 0.9 : 0.8,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  } as ISourceOptions), [darkMode]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden transition-colors duration-300 relative flex flex-col">
      {/* TSParticles Background */}
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          className="fixed inset-0 z-0 pointer-events-none"
          options={particlesOptions}
        />
      )}

      {/* Premium Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="glow-blur bg-emerald-500/20 w-[500px] h-[500px] -top-48 -left-48" />
        <div className="glow-blur bg-purple-500/10 w-[600px] h-[600px] -bottom-64 -right-64 animate-delay-1000" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full flex-grow flex flex-col">
        {/* Header */}
      <Header 
        mainView={mainView} 
        setMainView={setMainView} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
      />

      {/* Header Spacer */}
      <div className="h-20" />

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-zinc-200 dark:border-white/5 bg-white/95 dark:bg-black/95 backdrop-blur-2xl overflow-hidden fixed top-20 left-0 right-0 z-40"
          >
            <div className="px-4 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-zinc-500"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="text-sm font-black uppercase tracking-widest">Theme</span>
                </button>
                <button
                  onClick={() => { setMainView('settings'); setIsMenuOpen(false); }}
                  className={cn("flex items-center justify-center gap-2 px-4 py-4 rounded-xl border", mainView === 'settings' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500')}
                >
                  <Settings2 className="w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-widest">Settings</span>
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Home', icon: Home, onClick: () => { setMainView('home'); setIsMenuOpen(false); }, active: mainView === 'home' },
                  { label: 'Code Explainer', icon: Code2, onClick: () => { setMainView('project'); setIsMenuOpen(false); }, active: mainView === 'project' },
                  { label: 'History', icon: History, onClick: () => { setMainView('history'); setIsMenuOpen(false); }, active: mainView === 'history' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center gap-4 w-full p-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                      item.active 
                        ? "bg-emerald-500 text-black" 
                        : "bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className={cn(
        "mx-auto py-6 md:py-10 flex-grow w-full",
        mainView === 'project'
          ? "max-w-[1700px] px-3 sm:px-4 lg:px-6"
          : "max-w-7xl px-4 sm:px-6"
      )}>
        <AnimatePresence mode="wait">
          {mainView === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12 py-2"
            >
              <Hero setMainView={setMainView} />

              <Features />
            </motion.div>
          ) : mainView === 'project' ? (
            <motion.div 
              key="project"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mx-auto grid grid-cols-1 xl:grid-cols-[minmax(420px,0.95fr)_minmax(520px,1.25fr)] gap-5 xl:gap-6 items-start pb-10"
            >
              {/* Left Column: Input Panel */}
              <div className="space-y-6 lg:sticky lg:top-20 min-w-0">
                <div className="card-enterprise p-4 md:p-5 space-y-4 border-zinc-200/50 dark:border-white/5 shadow-enterprise h-[60vh] md:h-[80vh] flex flex-col">
                  {/* Settings Bar - Row 1: Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-2">
                     <div className="sm:col-span-2 space-y-2 group/field">
                       <label className="text-[10px] md:text-xs font-black text-zinc-400 group-hover/field:text-emerald-500 uppercase tracking-widest block transition-colors">Snippet Title</label>
                        <input 
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="New Analysis"
                          className="input-enterprise w-full bg-zinc-50/50 dark:bg-black/20 border-zinc-200/50 dark:border-white/5 font-bold text-xs p-3 rounded-lg h-[42px] focus:border-emerald-500/50 transition-all outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-widest block text-left">Language</label>
                        <CustomDropdown 
                          value={language}
                          options={LANGUAGES}
                          onChange={(val) => setLanguage(val)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-widest block text-left">Output</label>
                        <CustomDropdown 
                          value={outputLanguage}
                          options={OUTPUT_LANGUAGES}
                          onChange={(val) => setOutputLanguage(val)}
                        />
                     </div>
                  </div>

                  {/* Settings Bar - Row 2: Mode Selection */}
                  <div className="flex items-center gap-3">
                    <button className="h-[42px] px-6 rounded-xl bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                      <Code2 className="w-4 h-4" /> <span>Paste Code</span>
                    </button>
                    <div className="relative group/field">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <button
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className={cn(
                          "h-[42px] px-6 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 text-zinc-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all hover:text-emerald-500 hover:border-emerald-500/30",
                          selectedImage && "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        )}
                      >
                        <ImageIcon className={cn("w-3.5 h-3.5", selectedImage ? "text-emerald-500" : "text-zinc-400")} />
                        <span>{selectedImage ? "Image Added" : "Upload File"}</span>
                      </button>
                    </div>
                  </div>
                  {imageUploadError && (
                    <div className="text-[11px] font-bold text-red-500 dark:text-red-400 mt-1">
                      {imageUploadError}
                    </div>
                  )}

                  {/* Code textarea Container (MVP Mode) with Mac Header */}
                  <div 
                    className="flex-1 rounded-[1.5rem] overflow-hidden border border-zinc-200/50 dark:border-white/10 relative mt-4 bg-white dark:bg-[#0b0c10] flex flex-col shadow-lg"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={() => setIsDragging(false)}
                  >
                        {/* Mac-Style Header */}
                        <div className="h-10 border-b border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 px-5 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                             <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                             <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                          </div>
                          <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] italic">Editor Mode</div>
                        </div>

                        <div className="relative flex-1"> 
                          {/* Inner container for scrollable area */}
                          <textarea
                            className="w-full h-full p-4 md:p-6 text-sm font-['JetBrains_Mono','Fira_Code',monospace] bg-transparent text-zinc-900 dark:text-zinc-100 resize-none outline-none custom-scrollbar leading-relaxed"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="// សូមបញ្ចូលកូដរបស់អ្នកនៅទីនេះ ..."
                            spellCheck={false}
                          />
                          
                          {isDragging && (
                            <div className="absolute inset-0 z-50 bg-emerald-500/10 backdrop-blur-sm border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center p-8 text-emerald-500 animate-in fade-in zoom-in duration-200">
                              <ImageIcon className="w-16 h-16 mb-4 animate-bounce" />
                              <p className="text-xl font-black uppercase tracking-widest text-center italic">Drop screenshot here</p>
                              <p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-60">AI will analyze it instantly</p>
                            </div>
                          )}
                          
                          {selectedImage && (
                            <div className="absolute top-4 right-4 z-40 group/img">
                              <div className="relative">
                                <img 
                                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                                  alt="Preview" 
                                  className="w-24 h-24 object-cover rounded-xl border-2 border-emerald-500 shadow-xl animate-in fade-in zoom-in"
                                />
                                <button
                                  onClick={() => {
                                    setSelectedImage(null);
                                    setImageUploadError('');
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="mt-2 flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded shadow-sm">Attached</span>
                              </div>
                            </div>
                          )}
                        </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 shrink-0">
                    <button 
                      onClick={() => handleAction('Explain')}
                      disabled={loading}
                      className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 text-[11px] tracking-widest uppercase active:scale-95"
                    >
                      <BrainCircuit className="w-4 h-4" /> <span>Explain</span>
                    </button>
                    <button 
                      onClick={() => handleAction('Debug')}
                      disabled={loading}
                      className="bg-gradient-to-br from-red-500 to-red-600 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 text-[11px] tracking-widest uppercase active:scale-95"
                    >
                      <Bug className="w-4 h-4" /> <span>Debug</span>
                    </button>
                    <button 
                      onClick={() => handleAction('Refactor')}
                      disabled={loading}
                      className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 text-[11px] tracking-widest uppercase active:scale-95"
                    >
                      <Wand2 className="w-4 h-4" /> <span>Refactor</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Output */}
              <div className="space-y-6">
                <div 
                  ref={resultRef}
                  className="card-enterprise h-[60vh] md:h-[80vh] flex flex-col border-zinc-200/50 dark:border-white/5 relative overflow-hidden bg-white dark:bg-zinc-950/50"
                >
                  <div className="p-4 border-b border-zinc-200/50 dark:border-white/5 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50" />
                      <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                        {currentProject?.scope ? `${currentProject.scope} Output` : 'AI Explanation Output'}
                      </span>
                    </div>
                    {explanationResult && (
                       <button 
                        onClick={copyToClipboard}
                        className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-emerald-500 transition-all active:scale-95 group relative overflow-hidden"
                        title="Copy All"
                       >
                         <AnimatePresence mode="wait" initial={false}>
                            {copied ? (
                              <motion.div
                                key="check"
                                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                              >
                                <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </motion.div>
                            )}
                         </AnimatePresence>
                       </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                    {loading ? (
                      <div className="space-y-6">
                         {/* Modern Shimmer Skeleton */}
                         <div className="space-y-4">
                            <div className="h-8 w-3/4 rounded-lg bg-zinc-100 dark:bg-white/5 shimmer" />
                            <div className="space-y-2">
                               <div className="h-4 w-full rounded bg-zinc-100 dark:bg-white/5 shimmer" />
                               <div className="h-4 w-5/6 rounded bg-zinc-100 dark:bg-white/5 shimmer" />
                               <div className="h-4 w-4/6 rounded bg-zinc-100 dark:bg-white/5 shimmer" />
                            </div>
                            <div className="h-48 w-full rounded-xl bg-zinc-100 dark:bg-white/5 shimmer" />
                            <div className="space-y-2">
                               <div className="h-4 w-full rounded bg-zinc-100 dark:bg-white/5 shimmer" />
                               <div className="h-4 w-2/3 rounded bg-zinc-100 dark:bg-white/5 shimmer" />
                            </div>
                         </div>
                         
                         {/* Refined Loading Indicator */}
                         <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in slide-in-from-bottom-4">
                            <div className="relative shrink-0">
                               <div className="w-10 h-10 border-2 border-emerald-500/20 rounded-full" />
                               <div className="absolute top-0 left-0 w-10 h-10 border-2 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                            </div>
                            <div className="min-w-0">
                               <div className="text-emerald-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Processing</div>
                               <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-tight truncate">{actionStep}</div>
                            </div>
                         </div>
                      </div>
                    ) : explanationResult ? (
                      <div className={cn(
                        "prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-emerald-500 prose-h2:border-b-2 prose-h2:border-emerald-500/20 prose-h2:pb-2 prose-h2:mb-6 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:font-medium text-[14px] md:text-[15px] prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:shadow-md prose-pre:text-sm prose-pre:overflow-x-auto prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:font-bold prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-strong:text-zinc-900 dark:prose-strong:text-white prose-strong:font-black prose-li:text-zinc-700 dark:prose-li:text-zinc-300 prose-li:font-medium",
                        isKhmerOutput && "khmer-text"
                      )}>
                        <Markdown
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeValue = String(children).replace(/\n$/, '');
                              
                              return match ? (
                                <div className="my-4 md:my-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md bg-white dark:bg-[#0d0d12] group">
                                  <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 bg-zinc-50 dark:bg-[#16161a] border-b border-zinc-200 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">
                                        {match[1]}
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        navigator.clipboard.writeText(codeValue);
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        if (btn) {
                                          const originalIcon = btn.innerHTML;
                                          btn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                                          setTimeout(() => btn.innerHTML = originalIcon, 2000);
                                        }
                                      }}
                                      className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-emerald-500 transition-colors"
                                      title="Copy Code"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="p-0">
                                    <SyntaxHighlighter
                                      style={darkMode ? oneDark : prism}
                                      language={match[1]}
                                      PreTag="div"
                                      wrapLongLines={true}
                                      customStyle={{
                                        margin: 0,
                                        padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                                        fontSize: window.innerWidth < 768 ? '0.85rem' : '0.9rem',
                                        lineHeight: '1.6',
                                        background: 'transparent',
                                        wordBreak: 'break-all',
                                        whiteSpace: 'pre-wrap'
                                      }}
                                    >
                                      {codeValue}
                                    </SyntaxHighlighter>
                                  </div>
                                </div>
                              ) : (
                                <code className={cn("px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold", className)} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {explanationResult}
                        </Markdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                         <Terminal className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
                         <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs text-center max-w-[200px]">
                           No Assessment Yet.<br />Paste logic & hit action.
                         </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : mainView === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Saved <span className="text-emerald-500">Explanations</span></h2>
                  <p className="text-zinc-400 text-[10px] md:text-sm font-bold uppercase tracking-widest mt-1">Your past logic explanations and insights</p>
                </div>
                <button 
                  onClick={handleNewProject}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-5 h-5" /> New Snippet
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="card-enterprise p-12 text-center space-y-4 border-dashed border-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                    <History className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">No History Yet</h3>
                  <p className="text-zinc-500 text-sm font-medium">Start explaining code to build your history locally.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => selectProject(project)}
                      className="card-enterprise p-4 sm:p-6 cursor-pointer group hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors shrink-0">
                          <Code2 className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-black text-lg text-zinc-900 dark:text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                            <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Code: {project.language || 'Unknown'}</span>
                            <span className="flex items-center gap-1.5 text-blue-500"><Terminal className="w-3.5 h-3.5" /> Action: {project.scope || 'Explain'}</span>
                            <span className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> Output: {project.outputLanguage || 'English'}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 
                              {ensureDate(project.createdAt).toLocaleDateString() || 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDeleteProject(e, project.id!)}
                          className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <ChevronRight className="w-6 h-6 text-zinc-400 hidden sm:block" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : mainView === 'settings' ? (
             <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Global <span className="text-emerald-500">Settings</span></h2>
                <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">Configure your Code Clarity AI experience</p>
              </div>

              <div className="card-enterprise p-6 md:p-10 space-y-8">
                 
                 {/* Theme Settings */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
                    <div>
                       <h3 className="text-base md:text-lg font-black uppercase text-zinc-900 dark:text-white flex items-center gap-2"><Sun className="w-5 h-5 text-zinc-400" /> Appearance Theme</h3>
                       <p className="text-[10px] md:text-xs font-bold text-zinc-500 mt-2 leading-relaxed max-w-sm">Toggle between light or dark mode globally. The theme applies instantly and is saved to your browser securely.</p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-colors border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500"
                    >
                      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                      {darkMode ? 'Switch Light' : 'Switch Dark'}
                    </button>
                 </div>
                 
                 {/* Default Code Language Setting */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
                    <div>
                       <h3 className="text-base md:text-lg font-black uppercase text-zinc-900 dark:text-white flex items-center gap-2"><Code2 className="w-5 h-5 text-emerald-500" /> Default Code Language</h3>
                       <p className="text-[10px] md:text-xs font-bold text-zinc-500 mt-2 leading-relaxed max-w-sm">Select the programming language you use most often. New snippets will default to this language automatically.</p>
                    </div>
                    <div className="w-full md:w-64">
                       <CustomDropdown 
                          value={language}
                          options={LANGUAGES}
                          onChange={(val) => setLanguage(val)}
                          icon={FileCode}
                       />
                    </div>
                 </div>

                 {/* Default Output Language Setting */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
                    <div>
                       <h3 className="text-base md:text-lg font-black uppercase text-zinc-900 dark:text-white flex items-center gap-2"><Globe2 className="w-5 h-5 text-blue-500" /> Default Output Language</h3>
                       <p className="text-[10px] md:text-xs font-bold text-zinc-500 mt-2 leading-relaxed max-w-sm">Select your preferred human language for the AI Explanation output. Your responses will always be generated in this language.</p>
                    </div>
                    <div className="w-full md:w-64">
                       <CustomDropdown 
                          value={outputLanguage}
                          options={OUTPUT_LANGUAGES}
                          onChange={(val) => setOutputLanguage(val)}
                          icon={Globe2}
                       />
                    </div>
                 </div>

                 {/* Application Info */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
                    <div>
                       <h3 className="text-base md:text-lg font-black uppercase text-zinc-900 dark:text-white flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-500" /> Application Version</h3>
                       <p className="text-[10px] md:text-xs font-bold text-zinc-500 mt-2 leading-relaxed max-w-sm">Current software build deployed on system architecture strictly conforming to Project Requirements.</p>
                    </div>
                    <div className="text-left md:text-right">
                       <span className="inline-block px-5 py-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black tracking-[0.2em] text-sm rounded-xl border border-purple-500/20 uppercase">
                         Version 1.2.0
                       </span>
                    </div>
                 </div>

                 {/* Data Control */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 gap-4">
                    <div>
                       <h3 className="text-base md:text-lg font-black uppercase text-red-500 flex items-center gap-2"><Trash className="w-5 h-5" /> Danger Zone</h3>
                       <p className="text-[10px] md:text-xs font-bold text-zinc-500 mt-2 leading-relaxed max-w-sm">Permanently delete all your local history. This action cannot be reversed and all saved snippets will be lost.</p>
                    </div>
                    <div className="text-left md:text-right">
                       <button 
                         onClick={clearHistory}
                         disabled={projects.length === 0}
                         className="px-6 py-4 bg-red-500/10 text-red-500 font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20"
                       >
                         Wipe All Local History
                       </button>
                    </div>
                 </div>

              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
      
      {/* Footer reduced height and updated font */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-6 flex flex-col md:flex-row items-center content-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <BrainCircuit className="w-5 h-5 text-emerald-500" />
             <span className="font-black text-sm tracking-tight uppercase text-zinc-900 dark:text-white">Code Clarity AI</span>
          </div>
          <div className="text-xs md:text-sm font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-widest">
            &copy; {new Date().getFullYear()} Code Explainer AI. For Beginners by AI.
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
