import type { TechStackGroup } from "@resume/contracts";
import type { ModuleRenderProps } from "../types";

export function TechStackModule({ module, content }: ModuleRenderProps<"tech-stack">) {
  const { props } = module;
  const groups = props.groupIds
    .map((id) => content.techStack.find((g) => g.id === id))
    .filter((g): g is TechStackGroup => Boolean(g));

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="rs-type-title">{props.heading}</h2>
        {props.description ? (
          <p className="rs-fg-muted rs-type-body-sm">{props.description}</p>
        ) : null}
      </div>
      <dl className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <dt className="rs-fg-subtle rs-type-caption font-semibold">{group.label}</dt>
            <dd>
              <ul className="rs-justify flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rs-raised rs-line rounded-md border px-2.5 py-1 rs-type-body-sm font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
