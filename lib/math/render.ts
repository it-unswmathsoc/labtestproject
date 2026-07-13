import katex from "katex";

export interface RenderResult {
  html: string;
  error: boolean;
}

export function renderLatex(latex: string, displayMode = false): RenderResult {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: true,
      displayMode,
    });
    return { html, error: false };
  } catch {
    const safe = latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return {
      html: `<span class="katex-error" title="Invalid LaTeX">${safe}</span>`,
      error: true,
    };
  }
}
