export type CharacterName = 'bug' | 'olha' | 'runtime';

/** Display names, used for labels and `aria-label`. */
export const CHARACTER_NAMES: Readonly<Record<CharacterName, string>> = {
  bug: 'The Bug',
  olha: 'Olha',
  runtime: 'Mr. Runtime',
};

export interface CharacterProps {
  /** Replaces the default `aria-label`, for example "The Bug, looking guilty". */
  readonly label?: string;
}

/** The Bug: an orange beetle, proud mischief-maker (E08 section 5; paths from mockup A1). */
export function TheBug({ label = CHARACTER_NAMES.bug }: CharacterProps) {
  return (
    <svg
      className="ui-char"
      width="96"
      height="80"
      viewBox="0 0 96 80"
      role="img"
      aria-label={label}
      data-character="bug"
    >
      <ellipse className="ui-char-bug" cx="48" cy="48" rx="26" ry="22" />
      <line x1="48" y1="26" x2="48" y2="70" />
      <circle className="ui-char-ink" cx="48" cy="22" r="11" />
      <path d="M42 13 L34 3 M54 13 L62 3" />
      <path d="M22 40 L8 34 M22 52 L6 54 M74 40 L88 34 M74 52 L90 54" />
      <circle className="ui-char-ink" cx="38" cy="44" r="4" />
      <circle className="ui-char-ink" cx="58" cy="56" r="3" />
    </svg>
  );
}

/** Olha: the junior developer. Round head, hair bun, glasses, sticky-note shirt. */
export function Olha({ label = CHARACTER_NAMES.olha }: CharacterProps) {
  return (
    <svg
      className="ui-char"
      width="96"
      height="80"
      viewBox="0 0 96 80"
      role="img"
      aria-label={label}
      data-character="olha"
    >
      <path className="ui-char-sticky" d="M16 78 C16 60 30 54 48 54 C66 54 80 60 80 78 Z" />
      <circle className="ui-char-ink" cx="48" cy="9" r="7" />
      <circle className="ui-char-paper" cx="48" cy="34" r="19" />
      <path className="ui-char-ink" d="M29 32 C29 14 67 14 67 32 C60 24 38 24 29 32 Z" />
      <circle cx="41" cy="36" r="6" />
      <circle cx="56" cy="36" r="6" />
      <path d="M47 36 H50" />
      <circle className="ui-char-ink" cx="41" cy="36" r="1.5" />
      <circle className="ui-char-ink" cx="56" cy="36" r="1.5" />
      <path d="M43 46 C46 49 51 49 54 46" />
    </svg>
  );
}

/** Mr. Runtime: the grumpy clerk who executes rules literally. Visor, frown, bow tie. */
export function MrRuntime({ label = CHARACTER_NAMES.runtime }: CharacterProps) {
  return (
    <svg
      className="ui-char"
      width="96"
      height="80"
      viewBox="0 0 96 80"
      role="img"
      aria-label={label}
      data-character="runtime"
    >
      <path
        className="ui-char-suit"
        d="M12 78 L16 58 C20 52 34 50 48 50 C62 50 76 52 80 58 L84 78 Z"
      />
      <path className="ui-char-paper" d="M40 52 L48 66 L56 52 Z" />
      <path className="ui-char-ink" d="M42 62 L54 62 L42 70 L54 70 Z" />
      <rect className="ui-char-paper" x="28" y="14" width="40" height="38" rx="8" />
      <path className="ui-char-suit" d="M22 20 H74 L68 12 H28 Z" />
      <path d="M33 28 L43 31 M63 28 L53 31" />
      <circle className="ui-char-ink" cx="39" cy="35" r="2.5" />
      <circle className="ui-char-ink" cx="57" cy="35" r="2.5" />
      <path d="M40 46 C44 42 52 42 56 46" />
    </svg>
  );
}

/** One of the three characters, by name. Exhaustive: a new name fails type checking. */
export function Character({ who, label }: { readonly who: CharacterName } & CharacterProps) {
  switch (who) {
    case 'bug':
      return <TheBug label={label ?? CHARACTER_NAMES.bug} />;
    case 'olha':
      return <Olha label={label ?? CHARACTER_NAMES.olha} />;
    case 'runtime':
      return <MrRuntime label={label ?? CHARACTER_NAMES.runtime} />;
    default: {
      const never: never = who;
      return never;
    }
  }
}
