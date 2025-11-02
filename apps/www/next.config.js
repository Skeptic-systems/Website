const createNextIntlPlugin = require("next-intl/plugin");

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const baseConfig = {
  reactStrictMode: true,
};

const mergeTurboIntoTurbopack = (config) => {
  if (!isRecord(config)) {
    return config;
  }

  const experimental = isRecord(config.experimental) ? config.experimental : null;

  if (!experimental) {
    return config;
  }

  const turbo = isRecord(experimental.turbo) ? experimental.turbo : null;

  if (!turbo) {
    return config;
  }

  const experimentalRest = Object.keys(experimental).reduce((accumulator, key) => {
    if (key !== "turbo") {
      accumulator[key] = experimental[key];
    }

    return accumulator;
  }, {});

  const existingTurbopack = isRecord(config.turbopack) ? config.turbopack : null;

  const nextTurbopack = existingTurbopack ? { ...existingTurbopack } : {};

  Object.keys(turbo).forEach((key) => {
    if (key !== "resolveAlias") {
      nextTurbopack[key] = turbo[key];
    }
  });

  if (isRecord(turbo.resolveAlias)) {
    const existingAlias =
      existingTurbopack && isRecord(existingTurbopack.resolveAlias)
        ? existingTurbopack.resolveAlias
        : null;

    nextTurbopack.resolveAlias = {
      ...(existingAlias ? existingAlias : {}),
      ...turbo.resolveAlias,
    };
  }

  const base = {
    ...config,
    turbopack: nextTurbopack,
  };

  if (Object.keys(experimentalRest).length > 0) {
    return {
      ...base,
      experimental: experimentalRest,
    };
  }

  const { experimental: _removed, ...withoutExperimental } = base;
  return withoutExperimental;
};

const configWithIntl = withNextIntl(baseConfig);

module.exports = mergeTurboIntoTurbopack(configWithIntl);
