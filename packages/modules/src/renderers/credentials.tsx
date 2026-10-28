import { formatPeriod, formatYearMonth } from "../format";
import type { ModuleRenderProps } from "../types";

/** 학력·자격증: 콘텐츠에 있는 항목을 모두 최신순으로 보여준다. */
export function CredentialsModule({ module, content }: ModuleRenderProps<"credentials">) {
  const { props } = module;
  const education = [...content.education].sort((a, b) =>
    b.period.start.localeCompare(a.period.start),
  );
  const certifications = [...content.certifications].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="rs-type-title">{props.heading}</h2>
        {props.description ? (
          <p className="rs-fg-muted rs-type-body-sm">{props.description}</p>
        ) : null}
      </div>
      {/* 넓은 카드에서는 학력과 자격증을 나란히 둔다. */}
      <div className="grid gap-5 @3xl:grid-cols-2 @3xl:gap-10">
        {education.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="rs-fg-subtle rs-type-caption font-semibold">학력</h3>
            <ul className="flex flex-col gap-3">
              {education.map((item) => (
                <li key={item.id} className="flex flex-col gap-0.5">
                  {/* 학위를 먼저 내세우고, 학교는 괄호로 덧붙인다. 전공·학위가 없으면 학교를 제목으로 쓴다. */}
                  <span className="rs-type-body">
                    <span className="font-semibold">
                      {[item.major, item.degree].filter(Boolean).join(" ") || item.school}
                    </span>
                    {item.major || item.degree ? (
                      <span className="rs-fg-muted"> ({item.school})</span>
                    ) : null}
                  </span>
                  {item.note ? (
                    <span className="rs-fg-muted rs-type-body-sm">{item.note}</span>
                  ) : null}
                  <span className="rs-fg-subtle rs-type-caption tabular-nums">
                    {formatPeriod(item.period)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {certifications.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="rs-fg-subtle rs-type-caption font-semibold">자격증</h3>
            <ul className="flex flex-col gap-2">
              {certifications.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="rs-type-body font-semibold">{item.name}</span>
                    {item.issuer ? (
                      <span className="rs-fg-muted rs-type-body-sm">{item.issuer}</span>
                    ) : null}
                  </span>
                  <span className="rs-fg-subtle shrink-0 rs-type-caption tabular-nums">
                    {formatYearMonth(item.date)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
