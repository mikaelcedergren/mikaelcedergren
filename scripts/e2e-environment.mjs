export const E2E_BUILD_ENVIRONMENT_KEYS = Object.freeze(
  [
    'CI',
    'NG_CLI_ANALYTICS',
    'NPM_CONFIG_GLOBALCONFIG',
    'NPM_CONFIG_USERCONFIG',
    'PATH',
    'TMPDIR',
  ].sort(),
);
export const E2E_RELEASE_BUILD_ENVIRONMENT_KEYS = Object.freeze(
  [
    'CI',
    'NG_CLI_ANALYTICS',
    'NPM_CONFIG_GLOBALCONFIG',
    'NPM_CONFIG_USERCONFIG',
    'PATH',
    'SITE_RELEASE_BROWSER_DIR',
    'SITE_RELEASE_DIR',
    'TMPDIR',
  ].sort(),
);
export const E2E_SERVER_ENVIRONMENT_KEYS = Object.freeze(
  [
    'CX_SERVER_RELEASE_IDENTITY_FILE',
    'HOST',
    'NODE_ENV',
    'PATH',
    'PORT',
    'SITE_BROWSER_DIR',
    'TMPDIR',
  ].sort(),
);

export function createE2EBuildEnvironment({ pathValue, runtimeTemp }) {
  return exactEnvironment(
    'build',
    {
      CI: '1',
      NG_CLI_ANALYTICS: 'false',
      NPM_CONFIG_GLOBALCONFIG: '/dev/null',
      NPM_CONFIG_USERCONFIG: '/dev/null',
      PATH: pathValue,
      TMPDIR: runtimeTemp,
    },
    E2E_BUILD_ENVIRONMENT_KEYS,
  );
}

export function createE2EReleaseBuildEnvironment({
  browserDirectory,
  pathValue,
  releaseDirectory,
  runtimeTemp,
}) {
  return exactEnvironment(
    'release build',
    {
      CI: '1',
      NG_CLI_ANALYTICS: 'false',
      NPM_CONFIG_GLOBALCONFIG: '/dev/null',
      NPM_CONFIG_USERCONFIG: '/dev/null',
      PATH: pathValue,
      SITE_RELEASE_BROWSER_DIR: browserDirectory,
      SITE_RELEASE_DIR: releaseDirectory,
      TMPDIR: runtimeTemp,
    },
    E2E_RELEASE_BUILD_ENVIRONMENT_KEYS,
  );
}

export function createE2EServerEnvironment({
  browserDirectory,
  pathValue,
  port,
  runtimeTemp,
  serverIdentityFile,
}) {
  return exactEnvironment(
    'server',
    {
      CX_SERVER_RELEASE_IDENTITY_FILE: serverIdentityFile,
      HOST: '127.0.0.1',
      NODE_ENV: 'test',
      PATH: pathValue,
      PORT: String(port),
      SITE_BROWSER_DIR: browserDirectory,
      TMPDIR: runtimeTemp,
    },
    E2E_SERVER_ENVIRONMENT_KEYS,
  );
}

function exactEnvironment(label, values, expectedKeys) {
  const environment = Object.freeze(values);
  const keys = Object.keys(environment).sort();
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index]) ||
    Object.values(environment).some((value) => typeof value !== 'string' || value.length === 0)
  ) {
    throw new Error(`Mikael E2E ${label} environment must match its explicit synthetic set.`);
  }
  return environment;
}
