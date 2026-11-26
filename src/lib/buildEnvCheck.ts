import { parseEnvValues, renamedEnvFieldsIn, type EnvField } from "./envSchema";

export interface BuildEnvCheckResult {
  errors: string[];
  warnings: string[];
}

const BUILD_SCOPE_HINT =
  "On Netlify, give it the Builds scope and every deploy context that builds this branch.";

export const checkBuildEnv = (
  source: Record<string, unknown>,
): BuildEnvCheckResult => {
  const { values, invalidFields } = parseEnvValues(source);
  const errors = invalidFields.map(
    (name) => `${name} is set but its value is not valid.`,
  );
  const warnings: string[] = [];
  const reportedFields = new Set<EnvField>(invalidFields);

  for (const { previousName, currentName } of renamedEnvFieldsIn(source)) {
    if (values[currentName] !== undefined)
      warnings.push(
        `${previousName} is no longer read and can be deleted once every deployed branch uses ${currentName}.`,
      );
    else if (!reportedFields.has(currentName)) {
      reportedFields.add(currentName);
      errors.push(
        `${previousName} was renamed to ${currentName}, and ${currentName} is not set. Add ${currentName} with the same value. ${BUILD_SCOPE_HINT}`,
      );
    }
  }

  if (
    values.VITE_RELAY_SERVER_URL === undefined &&
    !reportedFields.has("VITE_RELAY_SERVER_URL")
  )
    warnings.push(
      `VITE_RELAY_SERVER_URL is not set, so live streaming and the analytics dashboard are off in this build. ${BUILD_SCOPE_HINT}`,
    );

  if (values.VITE_API_URL === undefined && !reportedFields.has("VITE_API_URL"))
    warnings.push(
      `VITE_API_URL is not set, so accounts and syncing are off in this build and the app works on this device only. ${BUILD_SCOPE_HINT}`,
    );

  return { errors, warnings };
};

export const formatBuildEnvErrors = (errors: readonly string[]): string =>
  [
    "The build stopped because of its environment variables:",
    ...errors.map((error) => `  - ${error}`),
    "Fix them in the hosting settings or .env, then build again.",
  ].join("\n");
