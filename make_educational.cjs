const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Reverse the brutalist zinc back to slate (adds blue hue)
code = code.replace(/zinc/g, 'slate');
code = code.replace(/bg-\[#060606\]/g, 'bg-slate-900');
code = code.replace(/bg-black\/60/g, 'bg-slate-950/80');

// Friendly, rounded, educational shapes
code = code.replace(/rounded-2xl/g, 'rounded-3xl');

// Add back vibrancy to the buttons
code = code.replace(/bg-white text-black hover:bg-slate-200/g, 'bg-indigo-600 text-white hover:bg-indigo-500 font-bold border-0 shadow-lg shadow-indigo-500/25');
code = code.replace(/bg-white text-black font-semibold rounded-lg text-sm hover:bg-slate-200 border border-transparent/g, 'bg-indigo-500 text-white font-bold rounded-xl text-sm hover:bg-indigo-400 shadow-md shadow-indigo-500/20');
code = code.replace(/bg-white text-black/g, 'bg-blue-600 text-white border-none shadow-md shadow-blue-500/20 hover:bg-blue-500');

// Restore some text colors
code = code.replace(/text-slate-300/g, 'text-slate-200'); // Better contrast for text
code = code.replace(/text-slate-400/g, 'text-slate-300'); // Brighten subtle text

// Gradients for educational "magical" feel
code = code.replace(/from-slate-800 to-slate-900/g, 'from-indigo-600 to-purple-600');
code = code.replace(/from-slate-300 to-slate-500/g, 'from-cyan-400 to-blue-500');
code = code.replace(/from-[#0a0a0a]\/20/g, 'from-slate-950/20');

// Subtle, engaging shadows instead of stark white drops
code = code.replace(/shadow-white\/5/g, 'shadow-indigo-500/10');
code = code.replace(/shadow-white\/10/g, 'shadow-indigo-500/20');

// Update Logo Box
code = code.replace(/<div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors shadow-sm shadow-indigo-500\/20">/g, '<div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 shadow-lg shadow-indigo-500/30 transition-all duration-300">');
code = code.replace(/<Box className="text-black w-5 h-5" \/>/g, '<Box className="text-white w-5 h-5" />');

// Adjust border softness
code = code.replace(/border-slate-800/g, 'border-indigo-500/10');
code = code.replace(/border-slate-800\/50/g, 'border-indigo-500/20');
code = code.replace(/border-slate-900/g, 'border-slate-800');

// Enhance rings/glows around panels
code = code.replace(/ring-white\/5/g, 'ring-indigo-500/10');

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx educational UI applied");
