/** Shared scenery. Theme changes cross-fade locally; no network requests at 19:00. */
export function ForestBackdrop() {
  return <div className="forest-backdrop" aria-hidden="true">
    <div className="forest-background-day"/>
    <div className="forest-background-night"/>
    <div className="forest-reading-haze"/>
  </div>;
}
