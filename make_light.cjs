const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/background-color: #0f172a;/g, 'background-color: #f8fafc;');
css = css.replace(/color: #fafafa;/g, 'color: #0f172a;');
fs.writeFileSync('src/index.css', css);

let code = fs.readFileSync('src/App.tsx', 'utf8');

// The most brutalist change: light mode everywhere!
// Backgrounds
code = code.replace(/bg-slate-950\/80/g, 'bg-white/80'); // Navbars/Modals
code = code.replace(/bg-slate-900/g, 'bg-white'); // Main cards
code = code.replace(/bg-slate-950/g, 'bg-slate-50'); // Inner components (inputs, sub-cards)
code = code.replace(/bg-\[#0a0a0a\]/g, 'bg-slate-100'); // Failsafe
code = code.replace(/bg-\[#060606\]/g, 'bg-slate-50'); // Failsafe

// Text colors
code = code.replace(/text-slate-50 /g, 'text-slate-900 ');
code = code.replace(/text-slate-100/g, 'text-slate-800');
code = code.replace(/text-slate-200/g, 'text-slate-700');
code = code.replace(/text-slate-300/g, 'text-slate-600');
code = code.replace(/text-slate-400/g, 'text-slate-500');
code = code.replace(/text-slate-500/g, 'text-slate-400'); // wait, lighter text on light background might be too light. Actually, text-slate-500 is good for subtle fields.
// Fix text-white except where it matters (buttons)
code = code.replace(/text-white/g, 'text-slate-900');
// Bring back text-white for buttons
code = code.replace(/text-slate-900 w-5 h-5/g, 'text-white w-5 h-5');
code = code.replace(/bg-blue-600 text-slate-900/g, 'bg-blue-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-blue-700 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all');
code = code.replace(/bg-indigo-600 text-slate-900 hover:bg-indigo-500 font-bold border-0 shadow-lg shadow-indigo-500\/25/g, 'bg-indigo-500 text-white font-bold tracking-wide rounded-2xl border-b-4 border-indigo-700 hover:bg-indigo-400 active:border-b-0 active:translate-y-1 transition-all');
code = code.replace(/bg-indigo-500 text-slate-900/g, 'bg-indigo-500 text-white');
code = code.replace(/bg-emerald-500 text-slate-900/g, 'bg-emerald-500 text-white');

// Make the nav title black
code = code.replace(/text-slate-900 drop-shadow-sm/g, 'text-slate-900');

// Borders
code = code.replace(/border-slate-800\/50/g, 'border-slate-200');
code = code.replace(/border-indigo-500\/10/g, 'border-slate-200');
code = code.replace(/border-indigo-500\/20/g, 'border-slate-200');
code = code.replace(/border-slate-800/g, 'border-slate-200');
code = code.replace(/border-slate-700/g, 'border-slate-300');

// Shadows & Glows - strip them for a cleaner, flatter Duolingo look
code = code.replace(/shadow-indigo-500\/10/g, 'shadow-sm shadow-slate-200');
code = code.replace(/shadow-indigo-500\/20/g, 'shadow-md shadow-slate-200');
code = code.replace(/shadow-indigo-500\/30/g, 'shadow-lg shadow-slate-200');
code = code.replace(/shadow-blue-500\/20/g, 'shadow-sm shadow-slate-200');
code = code.replace(/shadow-blue-500\/10/g, 'shadow-sm shadow-slate-200');
code = code.replace(/shadow-blue-500\/25/g, 'shadow-md shadow-slate-200');
code = code.replace(/shadow-black\/50/g, 'shadow-lg shadow-slate-200/50');
code = code.replace(/shadow-black\/20/g, 'shadow-sm shadow-slate-200');
code = code.replace(/shadow-white\/10/g, 'shadow-sm shadow-slate-200');
code = code.replace(/shadow-\[0_0_50px_-15px_rgba\(0,0,0,1\)\]/g, 'shadow-xl shadow-slate-200');

// Gradients inside cards -> clean flat colors
code = code.replace(/bg-gradient-to-b from-indigo-500\/10 to-purple-500\/10/g, 'bg-white');
code = code.replace(/bg-gradient-to-b from-emerald-500\/10 to-teal-500\/10/g, 'bg-white');
code = code.replace(/bg-gradient-to-b from-slate-900\/80 to-slate-900\/40/g, 'bg-white');
code = code.replace(/from-indigo-600 to-purple-600/g, 'from-indigo-100 to-indigo-50');
code = code.replace(/from-cyan-400 to-blue-500/g, 'from-blue-100 to-cyan-50');

// Rings
code = code.replace(/ring-indigo-500\/10/g, 'ring-slate-100');
code = code.replace(/ring-white\/5/g, 'ring-slate-100');

// Icons text colors that were light
code = code.replace(/text-slate-600/g, 'text-slate-400');

// Inputs
code = code.replace(/placeholder-slate-700/g, 'placeholder-slate-400');

// Fix specific dark mode remnants
code = code.replace(/backdrop-blur-xl/g, 'backdrop-blur-md bg-white/80 border-b border-slate-200');
code = code.replace(/bg-slate-50 p-4 rounded-3xl/g, 'bg-slate-50 p-6 rounded-[2rem]');

// Some fun educational classes for cards
code = code.replace(/border-slate-200 text-center relative overflow-hidden/g, 'border-slate-200 text-center relative overflow-hidden border-b-4');
code = code.replace(/bg-white border border-slate-200/g, 'bg-white border-2 border-slate-100 rounded-3xl shadow-sm');
code = code.replace(/bg-slate-50 border border-slate-200/g, 'bg-slate-50 border-2 border-slate-100 rounded-2xl');

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx educational LIGHT MODE applied");
