export async function askGemini(prompt: string, context: string) {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.text;
  } catch (error) {
    console.error("Gemini error:", error);
    return "Sorry, I'm having trouble connecting to my brain right now.";
  }
}
