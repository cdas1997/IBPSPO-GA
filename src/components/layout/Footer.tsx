type FooterProps = { checked: string };

export function Footer({ checked }: FooterProps) {
  return (
    <footer className="foot">
      <p>
        Questions researched from public sources (RBI, PIB, government releases and news) and fact-checked on {checked}. Current
        affairs move fast; confirm anything surprising against the latest RBI or PIB release.
      </p>
      <p>Your answers and mock history stay in this browser under your username. Nothing is sent anywhere.</p>
    </footer>
  );
}
