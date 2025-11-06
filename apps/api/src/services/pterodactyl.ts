import { pterodactylEnv } from "../config/env";

const APPLICATION_API_PREFIX = "/api/application";
const WINGS_API_PREFIX = "/api/servers";

type PterodactylPagination = {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
};

type PterodactylApplicationServerLimits = {
  memory: number;
  disk: number;
  cpu: number;
};

type PterodactylApplicationServerAttributes = {
  id: number;
  uuid: string;
  identifier: string;
  name: string;
  description: string | null;
  suspended: boolean;
  node: number;
  limits: PterodactylApplicationServerLimits & {
    swap: number;
    io: number;
    threads: string | null;
    oom_disabled: boolean;
  };
};

type PterodactylApplicationServer = {
  object: string;
  attributes: PterodactylApplicationServerAttributes;
};

type PterodactylNode = {
  id: number;
  fqdn: string;
  scheme: string;
  daemonListen: number;
};

type PterodactylNodeResponse = {
  object: string;
  attributes: Record<string, unknown>;
};

type PterodactylNodeConfiguration = {
  token: string;
};

type PterodactylNodeConfigurationResponse = {
  token?: unknown;
};

type PterodactylNodeConnection = {
  baseUrl: string;
  token: string;
};

type PterodactylApplicationServersResponse = {
  data: PterodactylApplicationServer[];
  meta: {
    pagination: PterodactylPagination;
  };
};

type PterodactylNetworkStats = {
  rx_bytes: number | null;
  tx_bytes: number | null;
};

type PterodactylUtilizationResources = {
  memory_bytes: number;
  cpu_absolute: number;
  disk_bytes: number;
  network?: PterodactylNetworkStats | null;
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

type PterodactylRequestOptions = {
  search?: Record<string, string>;
};

export type PterodactylServerResources = {
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

export type PterodactylServerMetadata = {
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

export type PterodactylActiveServer = PterodactylServerMetadata & {
  state: string;
  uptime: number | null;
};

export type PterodactylServersOverview = {
  totalServers: number;
  activeServersCount: number;
  activeServers: PterodactylActiveServer[];
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const createPterodactylUrl = (path: string): URL => {
  if (!path.startsWith("/")) {
    throw new Error(`Pterodactyl path must start with "/": ${path}`);
  }

  const url = new URL(pterodactylEnv.apiBaseUrl);
  const basePath = url.pathname === "/" ? "" : trimTrailingSlash(url.pathname);
  url.pathname = `${basePath}${path}`;
  url.search = "";

  return url;
};

const requestPterodactyl = async <T>(path: string, options?: PterodactylRequestOptions): Promise<T> => {
  const url = createPterodactylUrl(path);

  if (options?.search) {
    for (const [key, value] of Object.entries(options.search)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${pterodactylEnv.apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const preview = body.length > 200 ? `${body.slice(0, 200)}…` : body;
    throw new Error(
      `Failed to fetch Pterodactyl path ${path}: ${response.status} ${response.statusText} - ${preview}`
    );
  }

  return (await response.json()) as T;
};

const ensureNumber = (value: unknown, label: string): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid numeric value for ${label} in Pterodactyl response`);
  }

  return value;
};

const ensureOptionalNumber = (value: unknown, label: string): number | null => {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid numeric value for ${label} in Pterodactyl response`);
  }

  return value;
};

const ensureString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid string value for ${label} in Pterodactyl response`);
  }

  return value;
};

const ensureServerLimits = (value: unknown): PterodactylApplicationServerLimits & {
  swap: number;
  io: number;
  threads: string | null;
  oom_disabled: boolean;
} => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Pterodactyl server limits payload is malformed");
  }

  const limits = value as PterodactylApplicationServerLimits & {
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

const ensureServerAttributes = (value: unknown): PterodactylApplicationServerAttributes => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("identifier" in value) ||
    !("uuid" in value) ||
    !("name" in value) ||
    !("limits" in value) ||
    !("id" in value)
  ) {
    throw new Error("Pterodactyl server attributes are malformed");
  }

  const attributes = value as PterodactylApplicationServerAttributes;

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

const ensureNodeAttributes = (value: unknown): PterodactylNode => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Pterodactyl node payload is malformed");
  }

  const payload = value as Record<string, unknown>;

  return {
    id: ensureNumber(payload["id"], "attributes.id"),
    fqdn: ensureString(payload["fqdn"], "attributes.fqdn"),
    scheme: ensureString(payload["scheme"], "attributes.scheme"),
    daemonListen: ensureNumber(payload["daemon_listen"], "attributes.daemon_listen"),
  };
};

const ensureNodeConfiguration = (value: unknown): PterodactylNodeConfiguration => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Pterodactyl node configuration payload is malformed");
  }

  const payload = value as PterodactylNodeConfigurationResponse;
  const token = ensureString(payload.token, "token");

  return { token };
};

const ensureWingsUtilization = (value: unknown): WingsServerDetails => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Wings utilization payload is malformed");
  }

  return value as WingsServerDetails;
};

const ensureWingsUtilizationResources = (value: WingsUtilizationPayload | null | undefined): PterodactylUtilizationResources => {
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

const buildWingsBaseUrl = (node: PterodactylNode): string => {
  const portSegment = node.daemonListen ? `:${node.daemonListen}` : "";
  return `${node.scheme}://${node.fqdn}${portSegment}`;
};

const nodeAttributesCache = new Map<number, Promise<PterodactylNode>>();
const nodeConnectionCache = new Map<number, Promise<PterodactylNodeConnection>>();

const fetchPterodactylNode = async (nodeId: number): Promise<PterodactylNode> => {
  const response = await requestPterodactyl<PterodactylNodeResponse>(`${APPLICATION_API_PREFIX}/nodes/${nodeId}`);

  if (typeof response !== "object" || response === null || typeof response.attributes !== "object") {
    throw new Error(`Pterodactyl node ${nodeId} response is malformed`);
  }

  return ensureNodeAttributes(response.attributes);
};

const fetchPterodactylNodeConfiguration = async (nodeId: number): Promise<PterodactylNodeConfiguration> => {
  const response = await requestPterodactyl<PterodactylNodeConfigurationResponse>(
    `${APPLICATION_API_PREFIX}/nodes/${nodeId}/configuration`
  );

  return ensureNodeConfiguration(response);
};

const resolveNodeConnection = async (nodeId: number): Promise<PterodactylNodeConnection> => {
  if (!nodeConnectionCache.has(nodeId)) {
    const promise = (async (): Promise<PterodactylNodeConnection> => {
      if (!nodeAttributesCache.has(nodeId)) {
        nodeAttributesCache.set(nodeId, fetchPterodactylNode(nodeId));
      }

      const node = await nodeAttributesCache.get(nodeId)!;
      const configuration = await fetchPterodactylNodeConfiguration(nodeId);

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
  attributes: PterodactylApplicationServerAttributes
): PterodactylServerMetadata => ({
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
): Promise<PterodactylApplicationServersResponse> => {
  const response = await requestPterodactyl<PterodactylApplicationServersResponse>(
    APPLICATION_API_PREFIX + "/servers",
    {
      search: { page: String(page) },
    }
  );

  if (!Array.isArray(response.data)) {
    throw new Error("Pterodactyl server list response is missing data array");
  }

  if (
    typeof response.meta !== "object" ||
    response.meta === null ||
    typeof response.meta.pagination !== "object" ||
    response.meta.pagination === null
  ) {
    throw new Error("Pterodactyl server list response is missing pagination metadata");
  }

  return response;
};

const fetchAllApplicationServers = async (): Promise<{
  total: number;
  servers: PterodactylApplicationServerAttributes[];
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
  server: PterodactylApplicationServerAttributes
): Promise<PterodactylServerResources> => {
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

export const fetchPterodactylServerResources = async (
  serverIdentifier: string
): Promise<PterodactylServerResources> => {
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

export const fetchPterodactylServersOverview = async (): Promise<PterodactylServersOverview> => {
  const { total, servers } = await fetchAllApplicationServers();

  if (servers.length === 0) {
    return {
      totalServers: total,
      activeServersCount: 0,
      activeServers: [],
    };
  }

  const utilizations = await Promise.all(
    servers.map(async (server) => {
      const metadata = mapServerMetadata(server);
      const resources = await fetchApplicationServerUtilization(server);
      return {
        metadata,
        resources,
      };
    })
  );

  const activeServers = utilizations
    .filter(
      (entry) =>
        entry.resources.state === "running" && !entry.resources.isSuspended && !entry.metadata.isSuspended
    )
    .map((entry) => ({
      ...entry.metadata,
      state: entry.resources.state,
      uptime: entry.resources.uptime,
    }));

  return {
    totalServers: total,
    activeServersCount: activeServers.length,
    activeServers,
  };
};

export const fetchPterodactylActiveServers = async (): Promise<PterodactylActiveServer[]> => {
  const overview = await fetchPterodactylServersOverview();
  return overview.activeServers;
};

export const fetchPterodactylTotalServers = async (): Promise<number> => {
  const firstPage = await fetchApplicationServerListPage(1);
  return ensureNumber(firstPage.meta.pagination.total, "meta.pagination.total");
};

export const verifyPterodactylConnection = async (): Promise<void> => {
  await fetchApplicationServerListPage(1);
};

