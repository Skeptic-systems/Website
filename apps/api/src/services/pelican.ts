import { pelicanEnv } from "../config/env";

const APPLICATION_API_PREFIX = "/api/application";
const WINGS_API_PREFIX = "/api/servers";

type PelicanPagination = {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
};

type PelicanApplicationServerLimits = {
  memory: number;
  disk: number;
  cpu: number;
};

type PelicanApplicationServerAttributes = {
  id: number;
  uuid: string;
  identifier: string;
  name: string;
  description: string | null;
  suspended: boolean;
  node: number;
  limits: PelicanApplicationServerLimits & {
    swap: number;
    io: number;
    threads: string | null;
    oom_disabled: boolean;
  };
};

type PelicanApplicationServer = {
  object: string;
  attributes: PelicanApplicationServerAttributes;
};

type PelicanNode = {
  id: number;
  fqdn: string;
  scheme: string;
  daemonListen: number;
  daemonConnect: number | null;
};

type PelicanNodeResponse = {
  object: string;
  attributes: Record<string, unknown>;
};

type PelicanNodeConfiguration = {
  token: string;
};

type PelicanNodeConfigurationResponse = {
  token?: unknown;
};

type PelicanNodeConnection = {
  baseUrl: string;
  token: string;
};

type PelicanApplicationServersResponse = {
  data: PelicanApplicationServer[];
  meta: {
    pagination: PelicanPagination;
  };
};

type PelicanNetworkStats = {
  rx_bytes: number | null;
  tx_bytes: number | null;
};

type PelicanUtilizationResources = {
  memory_bytes: number;
  cpu_absolute: number;
  disk_bytes: number;
  network?: PelicanNetworkStats | null;
  uptime: number | null;
};

type WingsUtilizationNetwork = {
  rx_bytes?: unknown;
  tx_bytes?: unknown;
};

type WingsUtilizationPayload = {
  memory_bytes?: unknown;
  cpu_absolute?: unknown;
  disk_bytes?: unknown;
  network?: WingsUtilizationNetwork | null;
  uptime?: unknown;
};

type WingsServerDetails = {
  state?: unknown;
  is_suspended?: unknown;
  utilization?: WingsUtilizationPayload | null;
};

type PelicanRequestOptions = {
  search?: Record<string, string>;
};

export type PelicanServerResources = {
  identifier: string;
  state: string;
  isSuspended: boolean;
  memoryBytes: number;
  cpuPercent: number;
  diskBytes: number;
  network: {
    rxBytes: number | null;
    txBytes: number | null;
  };
  uptime: number | null;
};

export type PelicanServerMetadata = {
  id: number;
  identifier: string;
  uuid: string;
  name: string;
  description: string | null;
  isSuspended: boolean;
  limits: {
    memory: number;
    disk: number;
    cpu: number;
  };
};

export type PelicanActiveServer = PelicanServerMetadata & {
  state: string;
  uptime: number | null;
};

export type PelicanServersOverview = {
  totalServers: number;
  activeServersCount: number;
  activeServers: PelicanActiveServer[];
  telemetryAvailable: boolean;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const createPelicanUrl = (path: string): URL => {
  if (!path.startsWith("/")) {
    throw new Error(`Pelican path must start with "/": ${path}`);
  }

  const url = new URL(pelicanEnv.apiBaseUrl);
  const basePath = url.pathname === "/" ? "" : trimTrailingSlash(url.pathname);
  url.pathname = `${basePath}${path}`;
  url.search = "";

  return url;
};

const requestPelican = async <T>(path: string, options?: PelicanRequestOptions): Promise<T> => {
  const url = createPelicanUrl(path);

  if (options?.search) {
    for (const [key, value] of Object.entries(options.search)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${pelicanEnv.apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const preview = body.length > 200 ? `${body.slice(0, 200)}…` : body;
    throw new Error(
      `Failed to fetch Pelican path ${path}: ${response.status} ${response.statusText} - ${preview}`
    );
  }

  return (await response.json()) as T;
};

const ensureNumber = (value: unknown, label: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid numeric value for ${label} in Pelican response`);
  }

  return value;
};

const ensureOptionalNumber = (value: unknown, label: string): number | null => {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid numeric value for ${label} in Pelican response`);
  }

  return value;
};

const ensureString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid string value for ${label} in Pelican response`);
  }

  return value;
};

const ensureServerLimits = (value: unknown): PelicanApplicationServerLimits & {
  swap: number;
  io: number;
  threads: string | null;
  oom_disabled: boolean;
} => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Pelican server limits payload is malformed");
  }

  const limits = value as PelicanApplicationServerLimits & {
    swap: number;
    io: number;
    threads: string | null;
    oom_disabled: boolean;
  };

  return {
    memory: ensureNumber(limits.memory, "limits.memory"),
    disk: ensureNumber(limits.disk, "limits.disk"),
    cpu: ensureNumber(limits.cpu, "limits.cpu"),
    swap: ensureNumber(limits.swap, "limits.swap"),
    io: ensureNumber(limits.io, "limits.io"),
    threads:
      typeof limits.threads === "string" && limits.threads.length > 0 ? limits.threads : null,
    oom_disabled: Boolean(limits.oom_disabled),
  };
};

const ensureServerAttributes = (value: unknown): PelicanApplicationServerAttributes => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("identifier" in value) ||
    !("uuid" in value) ||
    !("name" in value) ||
    !("limits" in value) ||
    !("id" in value)
  ) {
    throw new Error("Pelican server attributes are malformed");
  }

  const attributes = value as PelicanApplicationServerAttributes;

  return {
    id: ensureNumber(attributes.id, "attributes.id"),
    uuid: ensureString(attributes.uuid, "attributes.uuid"),
    identifier: ensureString(attributes.identifier, "attributes.identifier"),
    name: ensureString(attributes.name, "attributes.name"),
    description:
      typeof attributes.description === "string" && attributes.description.length > 0
        ? attributes.description
        : null,
    suspended: Boolean((attributes as { suspended?: boolean }).suspended),
    node: ensureNumber((attributes as { node?: number }).node, "attributes.node"),
    limits: ensureServerLimits(attributes.limits),
  };
};

const ensureNodeAttributes = (value: unknown): PelicanNode => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Pelican node payload is malformed");
  }

  const payload = value as Record<string, unknown>;

  return {
    id: ensureNumber(payload["id"], "attributes.id"),
    fqdn: ensureString(payload["fqdn"], "attributes.fqdn"),
    scheme: ensureString(payload["scheme"], "attributes.scheme"),
    daemonListen: ensureNumber(payload["daemon_listen"], "attributes.daemon_listen"),
    daemonConnect: ensureOptionalNumber(payload["daemon_connect"], "attributes.daemon_connect"),
  };
};

const ensureNodeConfiguration = (value: unknown): PelicanNodeConfiguration => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Pelican node configuration payload is malformed");
  }

  const payload = value as PelicanNodeConfigurationResponse;
  const token = ensureString(payload.token, "token");

  return { token };
};

const ensureWingsUtilization = (value: unknown): WingsServerDetails => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Wings utilization payload is malformed");
  }

  return value as WingsServerDetails;
};

const ensureWingsUtilizationResources = (value: WingsUtilizationPayload | null | undefined): PelicanUtilizationResources => {
  if (!value || typeof value !== "object") {
    throw new Error("Wings utilization resources are missing");
  }

  const network = value.network && typeof value.network === "object" ? value.network : null;

  return {
    memory_bytes: ensureNumber(value.memory_bytes, "utilization.memory_bytes"),
    cpu_absolute: ensureNumber(value.cpu_absolute, "utilization.cpu_absolute"),
    disk_bytes: ensureNumber(value.disk_bytes, "utilization.disk_bytes"),
    network: network
      ? {
          rx_bytes: ensureOptionalNumber(network.rx_bytes, "utilization.network.rx_bytes"),
          tx_bytes: ensureOptionalNumber(network.tx_bytes, "utilization.network.tx_bytes"),
        }
      : null,
    uptime: ensureOptionalNumber(value.uptime, "utilization.uptime"),
  };
};

const buildWingsBaseUrl = (node: PelicanNode): string => {
  const port = node.daemonConnect ?? node.daemonListen;
  const portSegment = port ? `:${port}` : "";
  return `${node.scheme}://${node.fqdn}${portSegment}`;
};

const nodeAttributesCache = new Map<number, Promise<PelicanNode>>();
const nodeConnectionCache = new Map<number, Promise<PelicanNodeConnection>>();

const fetchPelicanNode = async (nodeId: number): Promise<PelicanNode> => {
  const response = await requestPelican<PelicanNodeResponse>(`${APPLICATION_API_PREFIX}/nodes/${nodeId}`);

  if (typeof response !== "object" || response === null || typeof response.attributes !== "object") {
    throw new Error(`Pelican node ${nodeId} response is malformed`);
  }

  return ensureNodeAttributes(response.attributes);
};

const fetchPelicanNodeConfiguration = async (nodeId: number): Promise<PelicanNodeConfiguration> => {
  const response = await requestPelican<PelicanNodeConfigurationResponse>(
    `${APPLICATION_API_PREFIX}/nodes/${nodeId}/configuration`
  );

  return ensureNodeConfiguration(response);
};

const resolveNodeConnection = async (nodeId: number): Promise<PelicanNodeConnection> => {
  if (!nodeConnectionCache.has(nodeId)) {
    const promise = (async (): Promise<PelicanNodeConnection> => {
      if (!nodeAttributesCache.has(nodeId)) {
        nodeAttributesCache.set(nodeId, fetchPelicanNode(nodeId));
      }

      const node = await nodeAttributesCache.get(nodeId)!;
      const configuration = await fetchPelicanNodeConfiguration(nodeId);

      return {
        baseUrl: buildWingsBaseUrl(node),
        token: configuration.token,
      };
    })();

    nodeConnectionCache.set(nodeId, promise);
  }

  return nodeConnectionCache.get(nodeId)!;
};

const mapServerMetadata = (
  attributes: PelicanApplicationServerAttributes
): PelicanServerMetadata => ({
  id: attributes.id,
  identifier: attributes.identifier,
  uuid: attributes.uuid,
  name: attributes.name,
  description: attributes.description,
  isSuspended: attributes.suspended,
  limits: {
    memory: attributes.limits.memory,
    disk: attributes.limits.disk,
    cpu: attributes.limits.cpu,
  },
});

const fetchApplicationServerListPage = async (
  page: number
): Promise<PelicanApplicationServersResponse> => {
  const response = await requestPelican<PelicanApplicationServersResponse>(
    APPLICATION_API_PREFIX + "/servers",
    {
      search: { page: String(page) },
    }
  );

  if (!Array.isArray(response.data)) {
    throw new Error("Pelican server list response is missing data array");
  }

  if (
    typeof response.meta !== "object" ||
    response.meta === null ||
    typeof response.meta.pagination !== "object" ||
    response.meta.pagination === null
  ) {
    throw new Error("Pelican server list response is missing pagination metadata");
  }

  return response;
};

const fetchAllApplicationServers = async (): Promise<{
  total: number;
  servers: PelicanApplicationServerAttributes[];
}> => {
  const firstPage = await fetchApplicationServerListPage(1);
  const pagination = firstPage.meta.pagination;

  const servers = firstPage.data.map((item) => ensureServerAttributes(item.attributes));

  if (pagination.total_pages > 1) {
    for (let page = 2; page <= pagination.total_pages; page += 1) {
      const nextPage = await fetchApplicationServerListPage(page);
      for (const item of nextPage.data) {
        servers.push(ensureServerAttributes(item.attributes));
      }
    }
  }

  return {
    total: ensureNumber(pagination.total, "meta.pagination.total"),
    servers,
  };
};

const fetchApplicationServerUtilization = async (
  server: PelicanApplicationServerAttributes
): Promise<PelicanServerResources> => {
  const { baseUrl, token } = await resolveNodeConnection(server.node);
  const wingsUrl = new URL(`${WINGS_API_PREFIX}/${server.uuid}`, baseUrl);

  let response: Response;

  try {
    response = await fetch(wingsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to connect to Wings for server ${server.uuid} at ${baseUrl}: ${message}`
    );
  }

  if (!response.ok) {
    const body = await response.text();
    const preview = body.length > 200 ? `${body.slice(0, 200)}…` : body;
    throw new Error(
      `Failed to fetch Wings server ${server.uuid}: ${response.status} ${response.statusText} - ${preview}`
    );
  }

  const payload = ensureWingsUtilization(await response.json());

  const state = ensureString(
    typeof payload.state === "string" && payload.state.length > 0 ? payload.state : "unknown",
    "wings.state"
  );
  const utilization = ensureWingsUtilizationResources(payload.utilization);

  return {
    identifier: server.identifier,
    state,
    isSuspended:
      typeof payload.is_suspended === "boolean" ? payload.is_suspended : server.suspended,
    memoryBytes: utilization.memory_bytes,
    cpuPercent: utilization.cpu_absolute,
    diskBytes: utilization.disk_bytes,
    network: {
      rxBytes: utilization.network?.rx_bytes ?? null,
      txBytes: utilization.network?.tx_bytes ?? null,
    },
    uptime: utilization.uptime,
  };
};

export const fetchPelicanServerResources = async (
  serverIdentifier: string
): Promise<PelicanServerResources> => {
  const trimmedIdentifier = serverIdentifier.trim();

  if (trimmedIdentifier.length === 0) {
    throw new Error("Server identifier must not be empty");
  }

  const { servers } = await fetchAllApplicationServers();
  const match = servers.find(
    (server) =>
      server.identifier === trimmedIdentifier ||
      server.uuid === trimmedIdentifier ||
      String(server.id) === trimmedIdentifier
  );

  if (!match) {
    throw new Error(`Server with identifier "${trimmedIdentifier}" was not found`);
  }

  return fetchApplicationServerUtilization(match);
};

export const fetchPelicanServersOverview = async (): Promise<PelicanServersOverview> => {
  const { total, servers } = await fetchAllApplicationServers();

  if (servers.length === 0) {
    return {
      totalServers: total,
      activeServersCount: 0,
      activeServers: [],
      telemetryAvailable: false,
    };
  }

  const utilizations = await Promise.all(
    servers.map(async (server) => {
      const metadata = mapServerMetadata(server);
      try {
        const resources = await fetchApplicationServerUtilization(server);
        return {
          metadata,
          resources,
        };
      } catch {
        return {
          metadata,
          resources: null,
        };
      }
    })
  );

  const telemetryAvailable = utilizations.some((entry) => entry.resources !== null);
  const activeServers = utilizations
    .filter(
      (entry) =>
        entry.resources !== null &&
        entry.resources.state === "running" &&
        !entry.resources.isSuspended &&
        !entry.metadata.isSuspended
    )
    .map((entry) => ({
      ...entry.metadata,
      state: entry.resources!.state,
      uptime: entry.resources!.uptime,
    }));

  return {
    totalServers: total,
    activeServersCount: activeServers.length,
    activeServers,
    telemetryAvailable,
  };
};

export const fetchPelicanActiveServers = async (): Promise<PelicanActiveServer[]> => {
  const overview = await fetchPelicanServersOverview();
  return overview.activeServers;
};

export const fetchPelicanTotalServers = async (): Promise<number> => {
  const firstPage = await fetchApplicationServerListPage(1);
  return ensureNumber(firstPage.meta.pagination.total, "meta.pagination.total");
};

export const verifyPelicanConnection = async (): Promise<void> => {
  await fetchApplicationServerListPage(1);
};

