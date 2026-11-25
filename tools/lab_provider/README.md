# Simulated provider for an isolated installation test

**Test equipment only. Never add this to a household HA installation or a release package.** It replaces methods of the real Eguraldi API class at runtime, so no real credentials are needed. It does not test authentication, network transport, parsing of real provider responses, or forecast accuracy. The installed Eguraldi files remain unchanged.

The test on 25 November 2026 used the official HA container 2026.11.1 and the public Eguraldi 0.11.2 ZIP with its published SHA-256. A new config directory and a generated local user were used. The container listened on loopback port 18123, without host networking, USB devices or household configuration. Only the test container was restarted/stopped.

## Reproduce the provider boundary

1. Create a disposable HA configuration directory. Download the public release ZIP, verify its SHA-256 and extract its `custom_components/euskalmet_local` there. Configure HA with public municipality coordinates, frontend, config and Recorder. Do not copy a household `.storage` directory or credentials.
2. Copy this directory's `__init__.py` to `/config/lab_provider.py` in the test container, and create `/config/lab_bootstrap.py`:

   ```python
   import asyncio
   import sys

   sys.path.insert(0, "/config")
   from lab_provider import async_setup

   asyncio.run(async_setup(None, {}))
   from homeassistant.__main__ import main

   main()
   ```

3. Start the official image with `python /config/lab_bootstrap.py -c /config` as the test entrypoint, a dedicated config mount and only `127.0.0.1:18123:8123` exposed. Do not run the provider as a normal YAML integration: config entries can resume before its patch is installed. The bootstrap installs it before HA starts.
4. Complete local onboarding with a new disposable account. Generate a throwaway RSA private key for the PEM format check and use `lab@example.invalid`; this key is not an Euskalmet credential. Do not publish the generated key or HA login/token files.
5. Add Eguraldi using HA's normal config flow. Select HA location, confirm the suggested Arboleda LAB station, then create an Eguraldi card with the visual editor. Follow [the recorded checks](../../docs/CLEAN_INSTALL_TEST.md).

The fixture supplies two stations, current readings, seven daily items and hourly items. Summaries, marine data, pollen, history and radar are intentionally empty. Alert completeness is unknown, so a truthful unknown state is expected. Hourly humidity is not exposed by the standard weather forecast; drying remains partial without a supplementary provider. Empty optional data must not be reported as real meteorological results.

The manifest in this directory describes the fixture used in the first setup attempt; it is not needed by the bootstrap. During development, an initial YAML-loaded fixture raced entry restoration and produced an authentication failure with the disposable credentials. That was a test-harness ordering issue; the bootstrap and subsequent restart check address it. This does not establish that real API authentication was validated.
