# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Unit tests (`npm test`) for question mapping, token expiry and error formatting.
- Clear error when the Google Forms API isn't enabled in the user's Cloud project (`403 accessNotConfigured`).
- Community files: code of conduct, issue and pull request templates.

### Changed
- Concurrent tool calls now share a single sign-in instead of opening several browser windows.
- Sign-in timeout error now includes the sign-in link in case no browser tab opened.
- `scale` questions reject a `scale_high` that isn't greater than `scale_low`.

## [0.1.0]

### Added
- Initial release: `create_form`, `get_form`, `add_question`, `list_responses`.
