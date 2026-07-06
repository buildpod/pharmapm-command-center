import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { lessonTracks } from "@/lib/guidance/learn";
import { publishedVideos } from "@/lib/guidance/videos";

// Learn — self-serve training (linked from the Guide drawer and command
// palette). Pure content page: tracks → collapsible lesson cards. All lesson
// text lives in lib/guidance/learn.ts so copy edits never touch this file.
export default function LearnPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={GraduationCap}
        title="Learn"
        subtitle="Short, plain-language lessons: project management fundamentals, how this command center computes its numbers, and why that matters. No certification required."
      />

      {/* Video guides render only when a video actually exists (has a
          YouTube id in lib/guidance/videos.ts) — no placeholder theatre. */}
      {publishedVideos.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Video guides</h2>
            <p className="text-sm text-muted-foreground">
              Watch instead of read — short walkthroughs per audience.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {publishedVideos.map((video) => (
              <figure key={video.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <figcaption className="px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {video.audience} · {video.minutes} min
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{video.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{video.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {lessonTracks.map((track) => (
        <section key={track.id} className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{track.title}</h2>
            <p className="text-sm text-muted-foreground">{track.description}</p>
          </div>
          <div className="space-y-2">
            {track.lessons.map((lesson) => (
              <details key={lesson.id} className="rounded-xl border border-border bg-card shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{lesson.title}</span>
                    <span className="block text-xs text-muted-foreground">{lesson.summary}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                    {lesson.minutes} min
                  </span>
                </summary>
                <div className="space-y-3 border-t border-border px-5 py-4">
                  {lesson.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="text-sm leading-6 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Takeaways</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {lesson.takeaways.map((takeaway) => (
                        <li key={takeaway}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
