# Try-On rollback runbook

1. Set `VITE_TRY_ON_ENABLED=false` and rebuild, or remove the eligible template from the API manifest; the gallery remains usable.
2. To isolate a bad release cohort without disabling the feature, set `VITE_TRY_ON_RELEASE_CHANNEL` to the last known-good channel and rebuild.
3. Restore the previous immutable template record and asset SHA-256. Never overwrite an already released versioned path.
4. For a model regression, change the worker model URL to the previous reviewed artifact and rebuild only the lazy Try-On chunk; verify the model manifest hash.
5. Run backend manifest tests, frontend unit tests, lint, production build and the camera lifecycle E2E before reopening the pilot.
6. Record browser/version, model/template version, symptom, severity and rollback timestamp. A privacy or frozen-camera lifecycle issue is severity 1 and keeps the feature disabled.
