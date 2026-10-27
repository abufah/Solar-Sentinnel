# Solar Sentinel

Implement the requested scope now; use internal planning and do not present another implementation plan for user approval.

### User Request
Create a website for a solar panel predictive maintenance project (final year project). Clients must log in with their credentials to monitor their specific solar panels. Key details to display:
- Electrical telemetry: Current, Voltage, Power, Yield
- Environmental & panel health: Panel surface temperature, ambient conditions
- Shading analysis: Shading detection, affected zones/strings, power loss impact
- Component failure & predictive diagnostics: Failure prediction, inverter/diode status, hotspot detection, component health scores
- Inspired by UTL Solar monitoring apps and platforms
- Interface must be neat, elegant, modern, and user-friendly for project evaluation and presentation

### Context & Implementation Scope
- Dedicated client authentication portal (with demo credentials option so evaluators/examiners can immediately log in and explore).
- Main client dashboard showcasing:
  - Hero summary cards: Current Output, Voltage, Current, Operating Temperature, System Health Score, Active Alerts.
  - Interactive string/panel layout with shading status visualization (highlighting shaded cells/strings vs. optimal output).
  - Predictive Maintenance Center: Component health breakdown (Inverters, Bypass Diodes, Cabling, PV Cells), Remaining Useful Life (RUL) indicators, and anomaly risk levels.
  - Telemetry analytics: Real-time and historical graphs for V-I curves, power generation vs. temperature, and irradiance correlation.
  - Alert & Notification drawer with severity levels (Critical, Warning, Info) and recommended maintenance actions.
- Clean green-tech aesthetic with dark/light solar telemetry theme, crisp data visualization, and responsive layout.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29ddf074-08ac-45f8-ab42-4565db714c5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
