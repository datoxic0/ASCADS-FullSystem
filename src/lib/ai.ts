import { GoogleGenAI } from '@google/genai';

export type AIEngine = 'power' | 'economy';

export function getAPIKey(provider: 'gemini' | 'openrouter'): string | null {
  const localKey = localStorage.getItem(`ascads_${provider}_key`);
  if (localKey) return localKey;
  
  if (provider === 'gemini') return import.meta.env.VITE_GEMINI_API_KEY || null;
  return null;
}

export function setAPIKey(provider: 'gemini' | 'openrouter', key: string) {
  if (key.trim() === '') {
    localStorage.removeItem(`ascads_${provider}_key`);
  } else {
    localStorage.setItem(`ascads_${provider}_key`, key.trim());
  }
}

export function getActiveEngine(): AIEngine {
    return (localStorage.getItem('ascads_ai_engine') as AIEngine) || 'power';
}

export function setActiveEngine(engine: AIEngine) {
    localStorage.setItem('ascads_ai_engine', engine);
}

export async function askAI(prompt: string, context?: object): Promise<string> {
  const engine = getActiveEngine();
  const systemCtx = context
    ? `\n\nCurrent context data:\n${JSON.stringify(context, null, 2)}`
    : '';
  const fullPrompt = `You are an expert electrical engineer, software developer, and circuit designer. Provide concise, technical, actionable advice.${systemCtx}\n\nUser: ${prompt}`;

  if (engine === 'power') {
    const key = getAPIKey('gemini');
    if (!key) {
      return '**Gemini Engine offline** — Add your Gemini API Key in the Settings to enable Power mode.';
    }
    try {
      const client = new GoogleGenAI({ apiKey: key });
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: fullPrompt,
      });
      return response.text ?? 'No response generated.';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `**Gemini AI Error:** ${msg}`;
    }
  } else {
    // Economy mode via OpenRouter
    const key = getAPIKey('openrouter');
    if (!key) {
      return '**OpenRouter Engine offline** — Add your OpenRouter API Key in the Settings to enable Economy mode.';
    }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ASCADS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free', // OpenRouter free model fallback
          messages: [
            { role: 'user', content: fullPrompt }
          ]
        })
      });
      
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
      }
      
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? 'No response generated.';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `**OpenRouter AI Error:** ${msg}`;
    }
  }
}

export async function askAI3D(prompt: string, currentScript: string): Promise<string> {
  const engine = getActiveEngine();
  const systemPrompt = `You are an expert mechanical engineer and OpenSCAD expert. 
You are generating Constructive Solid Geometry (CSG) javascript code for a custom 3D web CAD tool.

Available API:
- box(w, d, h)
- cylinder(r, h)
- sphere(r)
- translate(obj, x, y, z)
- rotate(obj, rx, ry, rz)
- scale(obj, sx, sy, sz)
- mirror(obj, mx, my, mz)
- union(a, b)
- subtract(a, b)
- intersect(a, b)

Rules:
1. ONLY return the raw JavaScript code. NO markdown formatting blocks like \`\`\`javascript.
2. NO explanations. Just code.
3. The code MUST end with a \`return\` statement that returns the final CSG object.
4. You may define intermediate variables.

Current Script Context:
${currentScript}`;

  if (engine === 'power') {
    const key = getAPIKey('gemini');
    if (!key) {
      throw new Error('Gemini Engine offline — Add your Gemini API Key in the Settings to enable Power mode.');
    }
    try {
      const client = new GoogleGenAI({ apiKey: key });
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nUser Request:\n${prompt}`,
      });
      
      let text = response.text || '';
      if (text.startsWith('\`\`\`')) {
        const lines = text.split('\n');
        lines.shift();
        if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
        text = lines.join('\n');
      }
      return text.trim();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini AI Error: ${msg}`);
    }
  } else {
    // Economy mode
    const key = getAPIKey('openrouter');
    if (!key) {
      throw new Error('OpenRouter Engine offline — Add your OpenRouter API Key in the Settings to enable Economy mode.');
    }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ASCADS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free', // Fallback to free models
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });
      
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${errBody}`);
      }
      
      const data = await res.json();
      let text = data.choices?.[0]?.message?.content || '';
      if (text.startsWith('\`\`\`')) {
        const lines = text.split('\n');
        lines.shift();
        if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
        text = lines.join('\n');
      }
      return text.trim();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenRouter AI Error: ${msg}`);
    }
  }
}
