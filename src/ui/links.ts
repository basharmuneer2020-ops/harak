import type { Exercise } from "../types";

const yt = (q: string) =>
  "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
const google = (q: string) =>
  "https://www.google.com/search?q=" + encodeURIComponent(q);

/** روابط الشرح الثلاثة: MuscleWiki عبر Google، وATHLEAN-X وJeff Nippard عبر YouTube */
export function explainLinks(ex: Pick<Exercise, "en">) {
  return [
    {
      key: "mw",
      label: "MuscleWiki",
      primary: true,
      url: google(`${ex.en} musclewiki`),
    },
    {
      key: "ax",
      label: "ATHLEAN-X",
      primary: false,
      url: yt(`${ex.en} athlean-x`),
    },
    {
      key: "jn",
      label: "Jeff Nippard",
      primary: false,
      url: yt(`${ex.en} jeff nippard`),
    },
  ];
}
