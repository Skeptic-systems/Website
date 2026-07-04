export type DockerRunResult = {
  serviceName: string;
  image: string;
  command: string[];
  ports: string[];
  volumes: string[];
  environment: string[];
  envFile: string[];
  networks: string[];
  labels: string[];
  restart: string;
  hostname: string;
  user: string;
  workingDir: string;
  entrypoint: string;
  expose: string[];
  tmpfs: string[];
  dns: string[];
  extraHosts: string[];
  capAdd: string[];
  capDrop: string[];
  privileged: boolean;
  tty: boolean;
  stdinOpen: boolean;
  detach: boolean;
  rm: boolean;
  healthcheck: {
    test: string;
    interval: string;
    timeout: string;
    retries: string;
    startPeriod: string;
  } | null;
  warnings: string[];
};

const IGNORED_FLAGS = new Set([
  "--sig-proxy",
  "--detach-keys",
  "--cidfile",
  "--log-driver",
  "--log-opt",
]);

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escapeNext) {
      if (ch === "\n") {
        escapeNext = false;
        continue;
      }
      current += ch;
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if ((ch === " " || ch === "\t") && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function consumeValue(
  tokens: string[],
  index: number,
  flag: string
): { value: string; next: number } {
  if (flag.includes("=")) {
    return { value: flag.split("=").slice(1).join("="), next: index };
  }
  if (index < tokens.length) {
    return { value: tokens[index], next: index + 1 };
  }
  return { value: "", next: index };
}

export function parseDockerRun(input: string): DockerRunResult {
  const raw = input.trim().replace(/^docker\s+run\s*/, "");
  const tokens = tokenize(raw);
  const warnings: string[] = [];

  const result: DockerRunResult = {
    serviceName: "",
    image: "",
    command: [],
    ports: [],
    volumes: [],
    environment: [],
    envFile: [],
    networks: [],
    labels: [],
    restart: "",
    hostname: "",
    user: "",
    workingDir: "",
    entrypoint: "",
    expose: [],
    tmpfs: [],
    dns: [],
    extraHosts: [],
    capAdd: [],
    capDrop: [],
    privileged: false,
    tty: false,
    stdinOpen: false,
    detach: false,
    rm: false,
    healthcheck: null,
    warnings: [],
  };

  let i = 0;
  let imageParsed = false;

  while (i < tokens.length) {
    const token = tokens[i];
    i++;

    if (!imageParsed && !token.startsWith("-")) {
      result.image = token;
      imageParsed = true;
      result.command = tokens.slice(i);
      break;
    }

    const flagKey = token.includes("=") ? token.split("=")[0] : token;

    if (IGNORED_FLAGS.has(flagKey)) {
      if (!token.includes("=")) i++;
      warnings.push(`Flag "${flagKey}" has no Compose equivalent and was skipped.`);
      continue;
    }

    switch (flagKey) {
      case "--name": {
        const { value, next } = consumeValue(tokens, i, token);
        result.serviceName = value;
        i = next;
        break;
      }
      case "-p":
      case "--publish": {
        const { value, next } = consumeValue(tokens, i, token);
        result.ports.push(value);
        i = next;
        break;
      }
      case "-v":
      case "--volume": {
        const { value, next } = consumeValue(tokens, i, token);
        result.volumes.push(value);
        i = next;
        break;
      }
      case "--mount": {
        const { value, next } = consumeValue(tokens, i, token);
        result.volumes.push(value);
        warnings.push(`--mount "${value}" was added to volumes; review bind vs volume semantics.`);
        i = next;
        break;
      }
      case "-e":
      case "--env": {
        const { value, next } = consumeValue(tokens, i, token);
        result.environment.push(value);
        i = next;
        break;
      }
      case "--env-file": {
        const { value, next } = consumeValue(tokens, i, token);
        result.envFile.push(value);
        i = next;
        break;
      }
      case "--network":
      case "--net": {
        const { value, next } = consumeValue(tokens, i, token);
        result.networks.push(value);
        i = next;
        break;
      }
      case "--restart": {
        const { value, next } = consumeValue(tokens, i, token);
        result.restart = value;
        i = next;
        break;
      }
      case "-h":
      case "--hostname": {
        const { value, next } = consumeValue(tokens, i, token);
        result.hostname = value;
        i = next;
        break;
      }
      case "-u":
      case "--user": {
        const { value, next } = consumeValue(tokens, i, token);
        result.user = value;
        i = next;
        break;
      }
      case "-w":
      case "--workdir": {
        const { value, next } = consumeValue(tokens, i, token);
        result.workingDir = value;
        i = next;
        break;
      }
      case "--entrypoint": {
        const { value, next } = consumeValue(tokens, i, token);
        result.entrypoint = value;
        i = next;
        break;
      }
      case "--expose": {
        const { value, next } = consumeValue(tokens, i, token);
        result.expose.push(value);
        i = next;
        break;
      }
      case "--tmpfs": {
        const { value, next } = consumeValue(tokens, i, token);
        result.tmpfs.push(value);
        i = next;
        break;
      }
      case "--dns": {
        const { value, next } = consumeValue(tokens, i, token);
        result.dns.push(value);
        i = next;
        break;
      }
      case "--add-host": {
        const { value, next } = consumeValue(tokens, i, token);
        result.extraHosts.push(value);
        i = next;
        break;
      }
      case "--cap-add": {
        const { value, next } = consumeValue(tokens, i, token);
        result.capAdd.push(value);
        i = next;
        break;
      }
      case "--cap-drop": {
        const { value, next } = consumeValue(tokens, i, token);
        result.capDrop.push(value);
        i = next;
        break;
      }
      case "-l":
      case "--label": {
        const { value, next } = consumeValue(tokens, i, token);
        result.labels.push(value);
        i = next;
        break;
      }
      case "--privileged": {
        result.privileged = true;
        break;
      }
      case "-t":
      case "--tty": {
        result.tty = true;
        break;
      }
      case "-i":
      case "--interactive": {
        result.stdinOpen = true;
        break;
      }
      case "-d":
      case "--detach": {
        result.detach = true;
        break;
      }
      case "--rm": {
        result.rm = true;
        break;
      }
      case "--health-cmd": {
        const { value, next } = consumeValue(tokens, i, token);
        if (!result.healthcheck) {
          result.healthcheck = {
            test: "",
            interval: "",
            timeout: "",
            retries: "",
            startPeriod: "",
          };
        }
        result.healthcheck.test = value;
        i = next;
        break;
      }
      case "--health-interval": {
        const { value, next } = consumeValue(tokens, i, token);
        if (!result.healthcheck) {
          result.healthcheck = {
            test: "",
            interval: "",
            timeout: "",
            retries: "",
            startPeriod: "",
          };
        }
        result.healthcheck.interval = value;
        i = next;
        break;
      }
      case "--health-timeout": {
        const { value, next } = consumeValue(tokens, i, token);
        if (!result.healthcheck) {
          result.healthcheck = {
            test: "",
            interval: "",
            timeout: "",
            retries: "",
            startPeriod: "",
          };
        }
        result.healthcheck.timeout = value;
        i = next;
        break;
      }
      case "--health-retries": {
        const { value, next } = consumeValue(tokens, i, token);
        if (!result.healthcheck) {
          result.healthcheck = {
            test: "",
            interval: "",
            timeout: "",
            retries: "",
            startPeriod: "",
          };
        }
        result.healthcheck.retries = value;
        i = next;
        break;
      }
      case "--health-start-period": {
        const { value, next } = consumeValue(tokens, i, token);
        if (!result.healthcheck) {
          result.healthcheck = {
            test: "",
            interval: "",
            timeout: "",
            retries: "",
            startPeriod: "",
          };
        }
        result.healthcheck.startPeriod = value;
        i = next;
        break;
      }
      case "-it":
      case "-ti": {
        result.tty = true;
        result.stdinOpen = true;
        break;
      }
      default: {
        if (token.startsWith("-") && token.length === 2) {
          const chars = token.slice(1);
          for (const c of chars) {
            if (c === "d") result.detach = true;
            else if (c === "t") result.tty = true;
            else if (c === "i") result.stdinOpen = true;
            else warnings.push(`Unknown short flag "-${c}" was skipped.`);
          }
        } else if (token.startsWith("-")) {
          if (!token.includes("=")) i++;
          warnings.push(`Unknown flag "${flagKey}" was skipped.`);
        } else {
          result.image = token;
          imageParsed = true;
          result.command = tokens.slice(i);
          i = tokens.length;
        }
      }
    }
  }

  if (result.rm) {
    warnings.push(
      `"--rm" has no direct Compose equivalent; the container will persist unless you add profiles/lifecycle hooks.`
    );
  }

  result.warnings = warnings;
  return result;
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function yamlList(items: string[], level: number): string {
  return items.map((item) => `${indent(level)}- "${item}"`).join("\n");
}

function yamlListUnquoted(items: string[], level: number): string {
  return items.map((item) => `${indent(level)}- ${item}`).join("\n");
}

export function generateComposeYaml(parsed: DockerRunResult): string {
  const lines: string[] = [];
  const svc = parsed.serviceName || parsed.image.split("/").pop()?.split(":")[0] || "app";

  lines.push("services:");
  lines.push(`${indent(1)}${svc}:`);
  lines.push(`${indent(2)}image: ${parsed.image}`);

  if (parsed.hostname) {
    lines.push(`${indent(2)}hostname: ${parsed.hostname}`);
  }

  if (parsed.entrypoint) {
    lines.push(`${indent(2)}entrypoint: ${parsed.entrypoint}`);
  }

  if (parsed.command.length > 0) {
    if (parsed.command.length === 1) {
      lines.push(`${indent(2)}command: ${parsed.command[0]}`);
    } else {
      lines.push(`${indent(2)}command:`);
      for (const c of parsed.command) {
        lines.push(`${indent(3)}- ${c}`);
      }
    }
  }

  if (parsed.restart) {
    lines.push(`${indent(2)}restart: ${parsed.restart}`);
  }

  if (parsed.user) {
    lines.push(`${indent(2)}user: "${parsed.user}"`);
  }

  if (parsed.workingDir) {
    lines.push(`${indent(2)}working_dir: ${parsed.workingDir}`);
  }

  if (parsed.tty) {
    lines.push(`${indent(2)}tty: true`);
  }

  if (parsed.stdinOpen) {
    lines.push(`${indent(2)}stdin_open: true`);
  }

  if (parsed.privileged) {
    lines.push(`${indent(2)}privileged: true`);
  }

  if (parsed.ports.length > 0) {
    lines.push(`${indent(2)}ports:`);
    lines.push(yamlList(parsed.ports, 3));
  }

  if (parsed.expose.length > 0) {
    lines.push(`${indent(2)}expose:`);
    lines.push(yamlList(parsed.expose, 3));
  }

  if (parsed.volumes.length > 0) {
    lines.push(`${indent(2)}volumes:`);
    lines.push(yamlList(parsed.volumes, 3));
  }

  if (parsed.tmpfs.length > 0) {
    lines.push(`${indent(2)}tmpfs:`);
    lines.push(yamlListUnquoted(parsed.tmpfs, 3));
  }

  if (parsed.environment.length > 0) {
    lines.push(`${indent(2)}environment:`);
    lines.push(yamlList(parsed.environment, 3));
  }

  if (parsed.envFile.length > 0) {
    lines.push(`${indent(2)}env_file:`);
    lines.push(yamlListUnquoted(parsed.envFile, 3));
  }

  if (parsed.networks.length > 0) {
    lines.push(`${indent(2)}networks:`);
    lines.push(yamlListUnquoted(parsed.networks, 3));
  }

  if (parsed.labels.length > 0) {
    lines.push(`${indent(2)}labels:`);
    lines.push(yamlList(parsed.labels, 3));
  }

  if (parsed.dns.length > 0) {
    lines.push(`${indent(2)}dns:`);
    lines.push(yamlListUnquoted(parsed.dns, 3));
  }

  if (parsed.extraHosts.length > 0) {
    lines.push(`${indent(2)}extra_hosts:`);
    lines.push(yamlList(parsed.extraHosts, 3));
  }

  if (parsed.capAdd.length > 0) {
    lines.push(`${indent(2)}cap_add:`);
    lines.push(yamlListUnquoted(parsed.capAdd, 3));
  }

  if (parsed.capDrop.length > 0) {
    lines.push(`${indent(2)}cap_drop:`);
    lines.push(yamlListUnquoted(parsed.capDrop, 3));
  }

  if (parsed.healthcheck) {
    lines.push(`${indent(2)}healthcheck:`);
    if (parsed.healthcheck.test) {
      lines.push(`${indent(3)}test: ["CMD-SHELL", "${parsed.healthcheck.test}"]`);
    }
    if (parsed.healthcheck.interval) {
      lines.push(`${indent(3)}interval: ${parsed.healthcheck.interval}`);
    }
    if (parsed.healthcheck.timeout) {
      lines.push(`${indent(3)}timeout: ${parsed.healthcheck.timeout}`);
    }
    if (parsed.healthcheck.retries) {
      lines.push(`${indent(3)}retries: ${parsed.healthcheck.retries}`);
    }
    if (parsed.healthcheck.startPeriod) {
      lines.push(`${indent(3)}start_period: ${parsed.healthcheck.startPeriod}`);
    }
  }

  if (parsed.networks.length > 0) {
    lines.push("");
    lines.push("networks:");
    for (const net of parsed.networks) {
      lines.push(`${indent(1)}${net}:`);
      lines.push(`${indent(2)}external: true`);
    }
  }

  return lines.join("\n");
}

export const DOCKER_RUN_EXAMPLES: readonly string[] = [
  `docker run -d --name nginx -p 80:80 -p 443:443 -v /data/nginx:/etc/nginx:ro --restart unless-stopped nginx:alpine`,
  `docker run -d --name postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=mydb -v pgdata:/var/lib/postgresql/data -p 5432:5432 --restart always postgres:16`,
  `docker run -d --name redis --network backend -p 6379:6379 --health-cmd "redis-cli ping" --health-interval 10s redis:7-alpine`,
  `docker run -d --name traefik --privileged -p 80:80 -p 443:443 -v /var/run/docker.sock:/var/run/docker.sock:ro --label "traefik.enable=true" traefik:v3.0`,
];
