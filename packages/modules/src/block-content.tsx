import type { Block, ListItem, RichText } from "@resume/contracts";
import { cn } from "@resume/ui/lib/utils";
import { MediaImage } from "./media-image";
import type { RenderOptions } from "./types";

/*
 * 프로젝트·회사 상세 본문(노션형 블록) 렌더러.
 * 저장 형식만 알고 편집기는 모른다. HTML 문자열을 쓰지 않으므로 dangerouslySetInnerHTML이 없다.
 */

function Inline({ text }: { text: RichText }) {
  return (
    <>
      {text.map((span, index) => {
        let node: React.ReactNode = span.text;
        if (span.marks?.includes("code")) {
          node = (
            <code className="rounded-xs bg-muted px-1 py-0.5 font-mono text-[0.9em]">{node}</code>
          );
        }
        if (span.marks?.includes("bold")) node = <strong className="font-bold">{node}</strong>;
        if (span.marks?.includes("italic")) node = <em>{node}</em>;
        if (span.href) {
          const external = /^https?:\/\//.test(span.href);
          node = (
            <a
              href={span.href}
              className="text-primary-text underline underline-offset-4"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {node}
            </a>
          );
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: 인라인 조각은 순서 외에 고유한 키가 없다
        return <span key={index}>{node}</span>;
      })}
    </>
  );
}

/** 서식 없는 글자만. 목차처럼 제목을 다른 곳에 보여줄 때 쓴다. */
export function plainText(text: RichText): string {
  return text.map((span) => span.text).join("");
}

/** 본문의 큰 제목(H2) 목록. 블록 ID가 제목의 앵커가 된다. */
export function blockHeadings(blocks: readonly Block[]): { id: string; text: string }[] {
  return blocks.flatMap((block) =>
    block.type === "heading" && block.level === 2
      ? [{ id: block.id, text: plainText(block.text) }]
      : [],
  );
}

const bulletStyles = ["list-disc", "list-[circle]", "list-[square]"];

function BulletedList({ items, depth }: { items: readonly ListItem[]; depth: number }) {
  return (
    <ul
      className={cn(
        "flex flex-col gap-1.5 pl-6 marker:text-subtle-foreground",
        bulletStyles[(depth - 1) % bulletStyles.length],
      )}
    >
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 목록 항목에는 별도 ID가 없다
        <li key={index}>
          <Inline text={item.text} />
          {item.children?.length ? (
            <div className="mt-1">
              <BulletedList items={item.children} depth={depth + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Table({ block }: { block: Extract<Block, { type: "table" }> }) {
  const head = block.headerRow ? block.rows[0] : undefined;
  const body = block.headerRow ? block.rows.slice(1) : block.rows;
  return (
    // 좁은 화면에서는 표만 가로로 스크롤한다.
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-body-sm">
        {head ? (
          <thead className="bg-muted">
            <tr>
              {head.map((cell, index) => (
                <th
                  // biome-ignore lint/suspicious/noArrayIndexKey: 표 칸에는 별도 ID가 없다
                  key={index}
                  scope="col"
                  className="border-border border-b px-3 py-2 text-start font-semibold not-first:border-l"
                >
                  <Inline text={cell} />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((row, rowIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 표 행에는 별도 ID가 없다
            <tr key={rowIndex} className="border-border not-last:border-b">
              {row.map((cell, index) => (
                <td
                  // biome-ignore lint/suspicious/noArrayIndexKey: 표 칸에는 별도 ID가 없다
                  key={index}
                  className="border-border px-3 py-2 align-top not-first:border-l"
                >
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockView({ block, options }: { block: Block; options: RenderOptions }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="min-h-[1lh]">
          <Inline text={block.text} />
        </p>
      );
    case "heading":
      return block.level === 2 ? (
        // 섹션마다 위에 선을 그어 나눈다. 첫 제목은 카드 맨 위라 선을 두지 않는다.
        <h2
          id={block.id}
          className="mt-6 scroll-mt-6 border-t border-border pt-8 text-heading font-extrabold tracking-tight first:mt-0 first:border-t-0 first:pt-0"
        >
          <Inline text={block.text} />
        </h2>
      ) : (
        <h3 className="mt-3 text-title font-bold tracking-tight">
          <Inline text={block.text} />
        </h3>
      );
    case "bulleted-list":
      return <BulletedList items={block.items} depth={1} />;
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary py-1 pl-5 text-body-lg font-semibold">
          <Inline text={block.text} />
        </blockquote>
      );
    case "callout":
      return (
        <aside
          className={cn(
            "rounded-lg px-4 py-3",
            block.tone === "warning"
              ? "bg-warning-soft text-warning"
              : "bg-primary-soft text-primary-text",
          )}
        >
          <Inline text={block.text} />
        </aside>
      );
    case "divider":
      return <hr className="border-border" />;
    case "table":
      return <Table block={block} />;
    case "image":
      if (block.media.kind !== "image") return null;
      return (
        <figure className="flex flex-col gap-2">
          <MediaImage
            media={block.media}
            options={options}
            sizes="(min-width: 1024px) 768px, 100vw"
            className="max-h-[40rem] w-auto rounded-lg border border-border"
          />
          {block.caption ? (
            <figcaption className="text-body-sm text-muted-foreground">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
  }
}

export function BlockContent({
  blocks,
  className,
  options = {},
}: {
  blocks: readonly Block[];
  className?: string;
  options?: RenderOptions;
}) {
  return (
    <div className={cn("flex flex-col gap-4 text-body leading-relaxed", className)}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} options={options} />
      ))}
    </div>
  );
}
