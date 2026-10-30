import {
  type Project,
  type ProjectIconKey,
  type ProjectTone,
  publicPaths,
} from "@resume/contracts";
import { Badge } from "@resume/ui/components/badge";
import { cn } from "@resume/ui/lib/utils";
import {
  Bell,
  BookOpen,
  Bot,
  Calendar,
  Camera,
  ChartLine,
  Clock,
  Code,
  Coffee,
  Coins,
  Dumbbell,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  House,
  Leaf,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Music,
  Palette,
  PenLine,
  PiggyBank,
  Plane,
  Rocket,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Terminal,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import { projectStatusLabel } from "../format";
import { CoverMedia } from "../media-image";
import { ModuleLink } from "../module-link";
import type { RenderOptions } from "../types";

const icons: Record<ProjectIconKey, LucideIcon> = {
  home: House,
  pen: PenLine,
  leaf: Leaf,
  clock: Clock,
  code: Code,
  sparkles: Sparkles,
  coins: Coins,
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  chart: ChartLine,
  calendar: Calendar,
  bell: Bell,
  book: BookOpen,
  graduation: GraduationCap,
  message: MessageCircle,
  heart: Heart,
  globe: Globe,
  "map-pin": MapPin,
  plane: Plane,
  smartphone: Smartphone,
  camera: Camera,
  music: Music,
  game: Gamepad2,
  cart: ShoppingCart,
  utensils: Utensils,
  coffee: Coffee,
  dumbbell: Dumbbell,
  palette: Palette,
  terminal: Terminal,
  bot: Bot,
  rocket: Rocket,
  zap: Zap,
};
// Tailwind가 찾을 수 있게 클래스 이름을 그대로 적는다.
const tones: Record<ProjectTone, string> = {
  blue: "bg-tone-blue",
  violet: "bg-tone-violet",
  green: "bg-tone-green",
  slate: "bg-tone-slate",
  red: "bg-tone-red",
  orange: "bg-tone-orange",
  amber: "bg-tone-amber",
  brown: "bg-tone-brown",
  lime: "bg-tone-lime",
  teal: "bg-tone-teal",
  cyan: "bg-tone-cyan",
  indigo: "bg-tone-indigo",
  purple: "bg-tone-purple",
  pink: "bg-tone-pink",
};

export function ProjectIcon({ project, size = "md" }: { project: Project; size?: "md" | "lg" }) {
  const Icon = icons[project.icon];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg text-white",
        size === "lg" ? "size-14" : "size-11",
        tones[project.tone],
      )}
      aria-hidden="true"
    >
      <Icon className={size === "lg" ? "size-7" : "size-5"} />
    </span>
  );
}

export function ProjectStatusBadge({ project }: { project: Project }) {
  return (
    <Badge variant={project.status === "live" ? "soft" : "outline"} className="rounded-sm">
      {projectStatusLabel[project.status]}
    </Badge>
  );
}

/** 프로젝트 카드. 홈 모듈과 개인 프로젝트 목록이 함께 쓴다. */
export function ProjectCard({
  project,
  layout,
  options,
  headingLevel = 3,
  priority = false,
}: {
  project: Project;
  layout: "wide" | "stacked";
  options: RenderOptions;
  /** 카드 제목의 단계. 홈 모듈(h2 아래)은 3, 페이지 제목(h1) 바로 아래 목록은 2 */
  headingLevel?: 2 | 3;
  /** 첫 화면에 보이는 카드는 커버를 지연 로딩하지 않는다 */
  priority?: boolean;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const media = (
    <CoverMedia
      media={project.cover}
      options={options}
      priority={priority}
      sizes={
        layout === "wide"
          ? "(min-width: 1024px) 640px, 100vw"
          : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
      }
    />
  );
  // 카드가 넘치지 않게 링크는 앞의 두 개만 보여준다. 전체는 상세 페이지에 있다.
  const links = project.links.slice(0, 2);
  const detailLink = (
    <ModuleLink
      href={publicPaths.project(project.slug)}
      options={options}
      withIcon
      className="ml-auto inline-flex items-center gap-1 text-body-sm font-semibold text-primary-text underline-offset-4 hover:underline"
    >
      <span className="sr-only">{project.title} </span>자세히 보기
    </ModuleLink>
  );
  return (
    <article
      className={cn(
        "@container flex h-full flex-col gap-4 rounded-xl bg-card p-5 text-card-foreground shadow-card",
        layout === "wide" && "@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @3xl:gap-8",
      )}
    >
      <div className="flex flex-1 flex-col gap-4">
        <header className="flex items-center gap-3">
          <ProjectIcon project={project} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Heading className="text-title font-bold tracking-tight">{project.title}</Heading>
              <ProjectStatusBadge project={project} />
            </div>
            <p className="text-body-sm text-muted-foreground">{project.tagline}</p>
          </div>
        </header>
        {layout === "wide" ? (
          <p className="text-body whitespace-pre-line text-muted-foreground">{project.summary}</p>
        ) : null}
        {layout === "stacked" ? media : null}
        {/*
         * 카드 바닥에 붙는 줄: 태그 한 줄 + 링크·자세히 보기 한 줄.
         * 링크가 없는 카드도 같은 높이를 두어, 나란한 카드끼리 줄이 맞는다.
         */}
        <div className="mt-auto flex flex-col gap-3">
          <p className="text-body-sm text-subtle-foreground">{project.tags.join(" · ")}</p>
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            {links.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <li key={link.id}>
                    <ModuleLink
                      href={link.href}
                      options={options}
                      withIcon
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-body-sm font-semibold transition-colors hover:bg-accent"
                    >
                      {link.label}
                    </ModuleLink>
                  </li>
                ))}
              </ul>
            ) : null}
            {detailLink}
          </div>
        </div>
      </div>
      {layout === "wide" ? media : null}
    </article>
  );
}
