# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Edit forms: `update_question`, `delete_item`, `move_item`, `update_form_info`.
- `add_questions` to add many questions and sections in one call (validated together, applied atomically).
- `set_accepting_responses` to open or close a form.
- New question types `date`, `time` and `section` (page break), plus question descriptions, shuffled choices and an "Other" choice.
- `list_responses` returns answers keyed by question text by default (`format: "raw"` restores the previous shape) and includes quiz grades and scores.
- Quiz support: `update_form_settings` tool (quiz mode on/off) and `correct_answers` / `points` on `add_question`.
- Unit tests (`npm test`) for question mapping, token expiry and error formatting.
- Clear error when the Google Forms API isn't enabled in the user's Cloud project (`403 accessNotConfigured`).
- Community files: code of conduct, issue and pull request templates.

### Security
- Sign-in listener validates the `Host` header, method and `state`, and ignores stray requests instead of aborting.
- Verify Google granted all requested scopes.
- Token file written atomically with permissions re-tightened on every save.
- Form IDs validated before use in URLs; 30s timeout on all network calls.
- Tool descriptions flag returned form text as untrusted data.
- CI: actions pinned to commit SHAs, CodeQL, production `npm audit` gate, `--ignore-scripts`; releases carry build-provenance attestations.

### Changed
- Concurrent tool calls now share a single sign-in instead of opening several browser windows.
- Sign-in timeout error now includes the sign-in link in case no browser tab opened.
- `scale` questions reject a `scale_high` that isn't greater than `scale_low`.

## [0.1.0]

### Added
- Initial release: `create_form`, `get_form`, `add_question`, `list_responses`.
