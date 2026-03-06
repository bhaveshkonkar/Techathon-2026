const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Colors
code = code.replace(/slate/g, 'zinc'); // Quick global swap to neutral gray

// Remove aggressive glowing shadows
code = code.replace(/shadow-\[0_0_15px_-3px_rgba[^\]]*\]/g, 'shadow-sm shadow-white/5');
code = code.replace(/shadow-\[0_0_20px_-5px_rgba[^\]]*\]/g, 'shadow-sm shadow-white/5');
code = code.replace(/shadow-emerald-500\/10/g, 'shadow-white/5');
code = code.replace(/shadow-emerald-500\/5/g, 'shadow-white/5');
code = code.replace(/shadow-emerald-500\/20/g, 'shadow-white/10');
code = code.replace(/shadow-black\/50/g, 'shadow-black/20');
code = code.replace(/shadow-2xl shadow-emerald/g, 'shadow-xl shadow-black');
code = code.replace(/shadow-2xl /g, 'shadow-xl ');

// Gradients - replace with monochromatic or subtle colors
code = code.replace(/from-emerald-500 to-purple-500/g, 'from-zinc-800 to-zinc-900');
code = code.replace(/from-emerald-500 to-teal-500/g, 'from-zinc-300 to-zinc-500');
code = code.replace(/from-zinc-900\/80 to-zinc-900\/40/g, 'from-zinc-900/50 to-[#0a0a0a]/20');
code = code.replace(/bg-gradient-to-b from-indigo-500\/10 to-purple-500\/10/g, 'bg-zinc-900/40 border-zinc-800/50');
code = code.replace(/bg-gradient-to-b from-emerald-500\/10 to-teal-500\/10/g, 'bg-zinc-900/40 border-zinc-800/50');
code = code.replace(/bg-gradient-to-r from-indigo-500 to-purple-500/g, 'bg-white text-black');

// Button & Text overrides
code = code.replace(/bg-emerald-500 text-white hover:bg-emerald-400/g, 'bg-white text-black hover:bg-zinc-200');
code = code.replace(/bg-indigo-500 text-white font-bold rounded-lg text-sm hover:bg-indigo-400/g, 'bg-white text-black font-semibold rounded-lg text-sm hover:bg-zinc-200 border border-transparent');
code = code.replace(/text-emerald-400/g, 'text-zinc-300'); // generic fallback
code = code.replace(/text-indigo-400/g, 'text-zinc-300'); // generic fallback
code = code.replace(/text-purple-400/g, 'text-zinc-300');
code = code.replace(/text-rose-400/g, 'text-zinc-400'); // soften red
code = code.replace(/text-amber-400/g, 'text-zinc-400'); // soften amber

// Turn giant radiuses down slightly for a tighter look
code = code.replace(/rounded-3xl/g, 'rounded-2xl');

// Main backgrounds
code = code.replace(/bg-zinc-950\/80/g, 'bg-black/60');
code = code.replace(/bg-zinc-950/g, 'bg-[#0a0a0a]');
code = code.replace(/bg-zinc-900\/50/g, 'bg-zinc-900/30');

// Typography overrides
code = code.replace(/<span className="font-bold text-xl tracking-tight text-zinc-100">GraspIQ<\/span>/g, '<span className="font-semibold text-lg tracking-tight text-white drop-shadow-sm">GraspIQ</span>');

// Remove border glows
code = code.replace(/border-emerald-/g, 'border-zinc-');
code = code.replace(/border-indigo-/g, 'border-zinc-');
code = code.replace(/border-rose-/g, 'border-zinc-');
code = code.replace(/border-amber-/g, 'border-zinc-');
code = code.replace(/border-blue-/g, 'border-zinc-');
code = code.replace(/ring-emerald-/g, 'ring-zinc-');

// Clean up buttons
code = code.replace(/font-bold/g, 'font-medium');
code = code.replace(/font-black/g, 'font-semibold');

// Get rid of the absolute top gradient bar
code = code.replace(/<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-800 to-zinc-900" \/>/g, '');

code = code.replace(/<Activity className="text-zinc-[0-9]+" \/>/g, '<Activity className="text-white" />');
code = code.replace(/bg-white text-black hover:bg-zinc-200 text-white hover:bg-zinc-200/g, "bg-white text-black hover:bg-zinc-200")

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx UI inside JS");
