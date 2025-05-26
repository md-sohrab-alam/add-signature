import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SignatureFont = {
  name: string;
  fontFamily: string;
  className: string;
};

export const signatureFonts: SignatureFont[] = [
  {
    name: "Dancing Script",
    fontFamily: "Dancing Script",
    className: "font-dancing-script",
  },
  {
    name: "Great Vibes",
    fontFamily: "Great Vibes",
    className: "font-great-vibes",
  },
  {
    name: "Parisienne",
    fontFamily: "Parisienne",
    className: "font-parisienne",
  },
  {
    name: "Alex Brush",
    fontFamily: "Alex Brush",
    className: "font-alex-brush",
  },
  {
    name: "Mr De Haviland",
    fontFamily: "Mr De Haviland",
    className: "font-mr-de-haviland",
  },
  {
    name: "Allura",
    fontFamily: "Allura",
    className: "font-allura",
  },
  {
    name: "Pinyon Script",
    fontFamily: "Pinyon Script",
    className: "font-pinyon-script",
  },
  {
    name: "Rouge Script",
    fontFamily: "Rouge Script",
    className: "font-rouge-script",
  },
  {
    name: "Tangerine",
    fontFamily: "Tangerine",
    className: "font-tangerine",
  },
  {
    name: "Yellowtail",
    fontFamily: "Yellowtail",
    className: "font-yellowtail",
  },
  {
    name: "Sacramento",
    fontFamily: "Sacramento",
    className: "font-sacramento",
  },
  {
    name: "Petit Formal Script",
    fontFamily: "Petit Formal Script",
    className: "font-petit-formal-script",
  },
  {
    name: "Herr Von Muellerhoff",
    fontFamily: "Herr Von Muellerhoff",
    className: "font-herr-von-muellerhoff",
  },
  {
    name: "Lovers Quarrel",
    fontFamily: "Lovers Quarrel",
    className: "font-lovers-quarrel",
  },
  {
    name: "Miss Fajardose",
    fontFamily: "Miss Fajardose",
    className: "font-miss-fajardose",
  },
  {
    name: "Monsieur La Doulaise",
    fontFamily: "Monsieur La Doulaise",
    className: "font-monsieur-la-doulaise",
  },
  {
    name: "Mrs Saint Delafield",
    fontFamily: "Mrs Saint Delafield",
    className: "font-mrs-saint-delafield",
  },
  {
    name: "Ruthie",
    fontFamily: "Ruthie",
    className: "font-ruthie",
  },
  {
    name: "Stalemate",
    fontFamily: "Stalemate",
    className: "font-stalemate",
  },
  {
    name: "Dr Sugiyama",
    fontFamily: "Dr Sugiyama",
    className: "font-dr-sugiyama",
  }
]; 