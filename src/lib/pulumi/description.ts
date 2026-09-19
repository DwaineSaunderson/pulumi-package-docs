/**
 * Pulumi schema descriptions embed per-language text as HTML-ish spans, e.g.
 * `<span pulumi-lang-nodejs="`length`" pulumi-lang-python="`length`" ...>`length`</span>`.
 * pulumi.com's docs site picks an attribute based on the selected language tab;
 * we don't have tabs, so we resolve each span to the project's own runtime up
 * front and strip the markup rather than rendering (or leaking) raw HTML.
 */
const LANG_SPAN_RE =
  /<span\s+((?:pulumi-lang-[a-z]+="[^"]*"\s*)+)>([\s\S]*?)<\/span>/g
const LANG_ATTR_RE = /pulumi-lang-([a-z]+)="([^"]*)"/g

function resolveLangSpans(text: string, runtime?: string): string {
  return text.replace(
    LANG_SPAN_RE,
    (_match, attrsSource: string, fallback: string) => {
      if (!runtime) return fallback

      LANG_ATTR_RE.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = LANG_ATTR_RE.exec(attrsSource))) {
        if (match[1] === runtime) return match[2]
      }
      return fallback
    },
  )
}

/** Resolves a schema description's per-language spans for the given Pulumi runtime. */
export function resolveDescription(
  text: string | undefined,
  runtime?: string,
): string | undefined {
  if (!text) return text
  return resolveLangSpans(text, runtime)
}
