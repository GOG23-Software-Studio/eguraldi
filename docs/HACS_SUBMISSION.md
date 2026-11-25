# Add Eguraldi integration — household microclimate and planning

Submission text prepared for a fresh PR to `hacs/default`. This file is not a submitted request. Use the current upstream PR template when sending and verify the release/CI links below at that time.

## Checklist

- [ ] I have read the current HACS publishing documentation.
- [x] The HACS action passes without errors or ignored checks on the candidate commit.
- [x] Hassfest passes on that same commit.
- [x] A full GitHub release was created after the validation actions passed.
- [ ] I am the repository owner or a major contributor, submitting from an editable personal fork.

Technical boxes refer to candidate 0.11.2 and its verified run below. The submitter must read the current rules and confirm the personal-fork declaration when opening the actual PR; recheck technical results if the candidate changes.

## Links

- Repository: https://github.com/GOG23-Software-Studio/eguraldi
- Candidate release: https://github.com/GOG23-Software-Studio/eguraldi/releases/tag/v0.11.2
- Successful HACS and hassfest job: https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070/job/139535862184
- Full successful CI run: https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070
- Functional comparison and code/test evidence: https://github.com/GOG23-Software-Studio/eguraldi/blob/main/docs/DIFFERENCES.md
- Reliability and limitations: https://github.com/GOG23-Software-Studio/eguraldi/blob/main/docs/RELIABILITY.md
- Previous submission: https://github.com/hacs/default/pull/14144

Evidence is recorded in [HACS_EVIDENCE.md](HACS_EVIDENCE.md). Refresh these links if a later candidate is submitted.

## Relationship to the previous submission

I maintain Eguraldi under GOG23-Software-Studio as @oyogor1985. The previous submission (#14144) was closed because Eguraldi substantially duplicated the active `mitxol/home-assistant-euskalmet` integration. I acknowledge that decision and am requesting a fresh assessment of the functional divergence since then, as the closing review allowed.

Eguraldi still derives from the original v2.12.9 under MIT and retains its license and attribution. It still shares substantial weather-provider code and uses the same Euskalmet API and personal credentials. Observations, hourly/daily forecasts, radar, history, marine data and pollen are not claimed as unique. The original remains active; this is not an abandoned-project replacement.

## What now differs

The main additions are household features with their own backend state and tests, not just new dashboard styling:

1. **Local Microclimate:** reads the user's local hourly Recorder statistics for a suitable outdoor sensor and the selected station. Training excludes the held-out validation days. The model must improve against the station baseline on both validation days before it publishes an estimated current temperature. Insufficient coverage and no demonstrated improvement are explicit states. This validates reconstruction of observations, not improved future forecast accuracy.
2. **Laundry monitoring:** per-entry, opt-in sessions and notification settings, disabled by default. The backend checks already-downloaded hourly forecasts with freshness limits, notification windows, configurable wind thresholds, session expiry and persisted duplicate suppression. It works without a dashboard open and does not select a notification recipient automatically.
3. **Household planning:** configurable windows for outdoor drying and outings, and a seven-day vehicle-washing comparison. Dedicated, tested models expose missing data and the limits of hourly/municipal guidance. A combined card presents these decisions alongside official warnings.
4. **Locality-centered setup and native bundled cards:** Home Assistant location or additional municipalities, local municipality lookup, nearby compatible station with manual override, synchronized metadata and visual editors. Alert cards offer list, moving band, timeline and compact headlines, with keyboard support, reduced-motion behavior and timed detail closure.

The comparison is pinned to an upstream commit and links each addition to implementation, tests and documentation. It does not claim that these features could not be contributed upstream; the maintainers may still decide that shared provider code warrants a single catalog entry.

## Previous review cleanup

The unused modified/minified `weather-radar-card-euskalmet.js` build and its obsolete frontend README were removed in 0.1.11. The current radar implementation has its own readable source in the repository. Leaflet and third-party licenses remain included, and the historical Weather Radar Card attribution is retained.

## Packaging and validation

Country: ES. Domain: `euskalmet_local`, distinct from the original's `euskalmet`. One integration per repository, all runtime assets bundled under its component directory, local `brand/icon.png` and `icon@2x.png`, MIT license, public issue tracker and Spanish/Basque UI and README. HACS validation has no `ignore` key. CI runs Python and frontend tests plus real-HA import/config-flow smoke tests for the declared minimum HA 2026.8.0 and HA 2026.11.1.

Public screenshots use simulated data. In addition to the maintainer's household HA, a [fresh isolated HA installation](CLEAN_INSTALL_TEST.md) was tested using the public 0.11.2 ZIP, unchanged integration files and a simulated API-method boundary. The exercise covered setup, entity creation, bundled cards, visual editor, live station changes and restart persistence. This was a manual install, not a clean HACS install or an independent household trial; real provider authentication and predictive accuracy were not validated by that exercise. A future HA device-registry deprecation warning is recorded in the report. Eguraldi remains available as a custom repository regardless of this review's outcome.
