import { radii, semanticColors, spacing, typeScale } from "@resume/tokens";

export function ColorTable() {
  return (
    <div className="not-prose grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {semanticColors.map((token) => (
        <div key={token.cssVar} className="overflow-hidden rounded-lg border border-border bg-card">
          <div
            className="h-16 border-b border-border"
            style={{ background: `var(${token.cssVar})` }}
          />
          <div className="flex flex-col gap-0.5 p-3 text-body-sm">
            <strong>{token.description}</strong>
            <code className="text-caption text-muted-foreground">{token.cssVar}</code>
            <span className="text-caption text-muted-foreground">
              {token.value} · <code>{token.utility}</code>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TypeTable() {
  return (
    <div className="not-prose flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
      {typeScale.map((token) => (
        <div key={token.name} className="flex flex-col gap-1 p-4">
          <span className="text-caption text-muted-foreground">
            <code>{token.utility}</code> · {token.size} / {token.lineHeight} · {token.usage}
          </span>
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: `var(--rs-text-${token.name})`, lineHeight: token.lineHeight }}
          >
            아이디어를 제품으로, 출시 이후의 개선까지.
          </span>
        </div>
      ))}
    </div>
  );
}

export function SpacingTable() {
  return (
    <div className="not-prose flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        {spacing.map((token) => (
          <div
            key={token.cssVar}
            className="grid grid-cols-[14rem_1fr] items-center gap-4 text-body-sm"
          >
            <span>
              <code className="text-caption">{token.cssVar}</code>
              <br />
              <span className="text-caption text-muted-foreground">
                {token.value} · {token.usage}
              </span>
            </span>
            <span
              className="h-3 rounded-xs bg-primary"
              style={{ width: `min(100%, var(${token.cssVar}))` }}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {radii.map((token) => (
          <div key={token.cssVar} className="flex flex-col items-center gap-2 text-caption">
            <span
              className="size-20 border border-border-strong bg-card"
              style={{ borderRadius: `var(${token.cssVar})` }}
            />
            <code>{token.utility}</code>
            <span className="text-muted-foreground">{token.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
