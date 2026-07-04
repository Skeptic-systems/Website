export type SourceType =
  | "pemCert"
  | "derCert"
  | "pkcs12"
  | "pkcs7"
  | "privateKey"
  | "encryptedKey"
  | "csr"
  | "certAndKey"
  | "multiplePem"
  | "none";

export type TargetType =
  | "pemCert"
  | "derCert"
  | "pkcs12"
  | "pkcs7"
  | "chainBundle"
  | "publicKey"
  | "decryptedKey"
  | "encryptedKey"
  | "pkcs8Key"
  | "csr"
  | "csrAndKey"
  | "selfSigned"
  | "selfSignedFromKey"
  | "selfSignedFromCsr"
  | "rsaKey"
  | "ecKey"
  | "certDetails"
  | "expiryCheck"
  | "fingerprint"
  | "keyMatch"
  | "verifyChain"
  | "viewCsr";

export type TargetCategory = "convert" | "bundle" | "keys" | "generate" | "inspect";

export type TargetMeta = {
  category: TargetCategory;
};

export const TARGET_META: Record<TargetType, TargetMeta> = {
  pemCert: { category: "convert" },
  derCert: { category: "convert" },
  pkcs7: { category: "convert" },
  pkcs12: { category: "bundle" },
  chainBundle: { category: "bundle" },
  publicKey: { category: "keys" },
  decryptedKey: { category: "keys" },
  encryptedKey: { category: "keys" },
  pkcs8Key: { category: "keys" },
  csr: { category: "generate" },
  csrAndKey: { category: "generate" },
  selfSigned: { category: "generate" },
  selfSignedFromKey: { category: "generate" },
  selfSignedFromCsr: { category: "generate" },
  rsaKey: { category: "generate" },
  ecKey: { category: "generate" },
  certDetails: { category: "inspect" },
  expiryCheck: { category: "inspect" },
  fingerprint: { category: "inspect" },
  keyMatch: { category: "inspect" },
  verifyChain: { category: "inspect" },
  viewCsr: { category: "inspect" },
};

export type SourceCategory = "certs" | "keys" | "requests" | "multi" | "fresh";

export type SourceGroup = {
  category: SourceCategory;
  items: readonly SourceType[];
};

export const SOURCE_GROUPS: readonly SourceGroup[] = [
  { category: "certs", items: ["pemCert", "derCert", "pkcs12", "pkcs7"] },
  { category: "keys", items: ["privateKey", "encryptedKey"] },
  { category: "requests", items: ["csr"] },
  { category: "multi", items: ["certAndKey", "multiplePem"] },
  { category: "fresh", items: ["none"] },
];

export type CertParams = {
  inputFile: string;
  outputFile: string;
  keyFile: string;
  caFile: string;
  chainFiles: string;
  intermediateCaFile: string;
  password: string;
  outPassword: string;
  cn: string;
  org: string;
  ou: string;
  country: string;
  state: string;
  locality: string;
  email: string;
  san: string;
  days: string;
  keySize: "2048" | "4096";
  curve: "prime256v1" | "secp384r1" | "secp521r1";
  hash: "sha256" | "sha384" | "sha512";
};

export type ParamField = {
  key: keyof CertParams;
  required: boolean;
  type: "text" | "password" | "select";
  options?: readonly string[];
};

export type OperationSpec = {
  params: readonly ParamField[];
  generate: (p: CertParams) => string;
};

const VALID_TARGETS: Record<SourceType, readonly TargetType[]> = {
  pemCert: [
    "derCert", "pkcs7",
    "pkcs12", "chainBundle",
    "certDetails", "expiryCheck", "fingerprint",
  ],
  derCert: [
    "pemCert",
    "pkcs12",
    "certDetails", "expiryCheck", "fingerprint",
  ],
  pkcs12: [
    "pemCert", "derCert", "pkcs7",
    "certDetails",
  ],
  pkcs7: ["pemCert"],
  privateKey: [
    "publicKey", "encryptedKey", "pkcs8Key",
    "csr", "selfSignedFromKey",
  ],
  encryptedKey: ["decryptedKey", "publicKey"],
  csr: ["viewCsr", "selfSignedFromCsr"],
  certAndKey: ["pkcs12", "keyMatch"],
  multiplePem: ["chainBundle", "verifyChain"],
  none: ["rsaKey", "ecKey", "csrAndKey", "selfSigned"],
};

const f = (v: string, fallback: string): string => v.trim() || fallback;

const subjectString = (p: CertParams): string => {
  const parts: string[] = [];
  if (p.cn) parts.push(`/CN=${p.cn}`);
  if (p.country) parts.push(`/C=${p.country}`);
  if (p.state) parts.push(`/ST=${p.state}`);
  if (p.locality) parts.push(`/L=${p.locality}`);
  if (p.org) parts.push(`/O=${p.org}`);
  if (p.ou) parts.push(`/OU=${p.ou}`);
  if (p.email) parts.push(`/emailAddress=${p.email}`);
  return parts.length > 0 ? `"${parts.join("")}"` : '"/CN=localhost"';
};

const sanFlags = (san: string): string => {
  if (!san.trim()) return "";
  const entries = san.split(",").map((s) => s.trim()).filter(Boolean);
  const values = entries.map((e) => {
    if (/^\d+\.\d+\.\d+\.\d+$/.test(e)) return `IP:${e}`;
    return `DNS:${e}`;
  });
  return ` -addext "subjectAltName=${values.join(",")}"`;
};

const inFile: ParamField = { key: "inputFile", required: true, type: "text" };
const outFile: ParamField = { key: "outputFile", required: true, type: "text" };
const keyFile: ParamField = { key: "keyFile", required: true, type: "text" };
const caFile: ParamField = { key: "caFile", required: true, type: "text" };
const chainFiles: ParamField = { key: "chainFiles", required: false, type: "text" };
const intermediateCa: ParamField = { key: "intermediateCaFile", required: false, type: "text" };
const pw: ParamField = { key: "password", required: false, type: "password" };
const outPw: ParamField = { key: "outPassword", required: false, type: "password" };
const cn: ParamField = { key: "cn", required: true, type: "text" };
const org: ParamField = { key: "org", required: false, type: "text" };
const ou: ParamField = { key: "ou", required: false, type: "text" };
const country: ParamField = { key: "country", required: false, type: "text" };
const stField: ParamField = { key: "state", required: false, type: "text" };
const locality: ParamField = { key: "locality", required: false, type: "text" };
const email: ParamField = { key: "email", required: false, type: "text" };
const sanField: ParamField = { key: "san", required: false, type: "text" };
const days: ParamField = { key: "days", required: false, type: "text" };
const keySize: ParamField = { key: "keySize", required: true, type: "select", options: ["2048", "4096"] };
const curve: ParamField = { key: "curve", required: true, type: "select", options: ["prime256v1", "secp384r1", "secp521r1"] };
const hash: ParamField = { key: "hash", required: false, type: "select", options: ["sha256", "sha384", "sha512"] };

const OPERATIONS: Record<string, OperationSpec> = {
  // ── PEM Certificate ──
  "pemCert->derCert": {
    params: [inFile, outFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.pem")} -outform DER -out ${f(p.outputFile, "cert.der")}`,
  },
  "pemCert->pkcs7": {
    params: [inFile, outFile],
    generate: (p) =>
      `openssl crl2pkcs7 -nocrl -certfile ${f(p.inputFile, "cert.pem")} -out ${f(p.outputFile, "cert.p7b")}`,
  },
  "pemCert->pkcs12": {
    params: [inFile, keyFile, outFile, chainFiles, outPw],
    generate: (p) => {
      const passFlag = p.outPassword ? `-passout pass:${p.outPassword}` : "-passout pass:";
      const chainFlag = p.chainFiles ? ` -certfile ${p.chainFiles}` : "";
      return `openssl pkcs12 -export -in ${f(p.inputFile, "cert.pem")} -inkey ${f(p.keyFile, "private.key")}${chainFlag} ${passFlag} -out ${f(p.outputFile, "bundle.p12")}`;
    },
  },
  "pemCert->chainBundle": {
    params: [inFile, intermediateCa, caFile, outFile],
    generate: (p) => {
      const files = [f(p.inputFile, "server.pem")];
      if (p.intermediateCaFile.trim()) files.push(p.intermediateCaFile.trim());
      files.push(f(p.caFile, "ca.pem"));
      return `cat ${files.join(" ")} > ${f(p.outputFile, "fullchain.pem")}`;
    },
  },
  "pemCert->certDetails": {
    params: [inFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.pem")} -text -noout`,
  },
  "pemCert->expiryCheck": {
    params: [inFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.pem")} -noout -dates`,
  },
  "pemCert->fingerprint": {
    params: [inFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.pem")} -noout -fingerprint -sha256`,
  },

  // ── DER Certificate ──
  "derCert->pemCert": {
    params: [inFile, outFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.der")} -inform DER -out ${f(p.outputFile, "cert.pem")} -outform PEM`,
  },
  "derCert->pkcs12": {
    params: [inFile, keyFile, outFile, outPw],
    generate: (p) => {
      const passFlag = p.outPassword ? `-passout pass:${p.outPassword}` : "-passout pass:";
      return [
        `# Convert DER to PEM, then bundle with key`,
        `openssl x509 -in ${f(p.inputFile, "cert.der")} -inform DER -out /tmp/cert.pem -outform PEM`,
        `openssl pkcs12 -export -in /tmp/cert.pem -inkey ${f(p.keyFile, "private.key")} ${passFlag} -out ${f(p.outputFile, "bundle.p12")}`,
      ].join("\n");
    },
  },
  "derCert->certDetails": {
    params: [inFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.der")} -inform DER -text -noout`,
  },
  "derCert->expiryCheck": {
    params: [inFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.der")} -inform DER -noout -dates`,
  },
  "derCert->fingerprint": {
    params: [inFile],
    generate: (p) =>
      `openssl x509 -in ${f(p.inputFile, "cert.der")} -inform DER -noout -fingerprint -sha256`,
  },

  // ── PKCS#12 / PFX ──
  "pkcs12->pemCert": {
    params: [inFile, outFile, pw],
    generate: (p) => {
      const passFlag = p.password ? `-passin pass:${p.password}` : "-passin pass:";
      return [
        `# Extract certificate`,
        `openssl pkcs12 -in ${f(p.inputFile, "bundle.p12")} -clcerts -nokeys ${passFlag} -out ${f(p.outputFile, "cert.pem")}`,
        ``,
        `# Extract private key`,
        `openssl pkcs12 -in ${f(p.inputFile, "bundle.p12")} -nocerts -nodes ${passFlag} -out private.key`,
        ``,
        `# Extract CA chain (if present)`,
        `openssl pkcs12 -in ${f(p.inputFile, "bundle.p12")} -cacerts -nokeys ${passFlag} -out ca-chain.pem`,
      ].join("\n");
    },
  },
  "pkcs12->derCert": {
    params: [inFile, outFile, pw],
    generate: (p) => {
      const passFlag = p.password ? `-passin pass:${p.password}` : "-passin pass:";
      return [
        `# Extract PEM first, then convert to DER`,
        `openssl pkcs12 -in ${f(p.inputFile, "bundle.p12")} -clcerts -nokeys ${passFlag} -out /tmp/cert.pem`,
        `openssl x509 -in /tmp/cert.pem -outform DER -out ${f(p.outputFile, "cert.der")}`,
      ].join("\n");
    },
  },
  "pkcs12->pkcs7": {
    params: [inFile, outFile, pw],
    generate: (p) => {
      const passFlag = p.password ? `-passin pass:${p.password}` : "-passin pass:";
      return [
        `# Extract PEM certificates, then wrap as PKCS#7`,
        `openssl pkcs12 -in ${f(p.inputFile, "bundle.p12")} -nokeys ${passFlag} -out /tmp/certs.pem`,
        `openssl crl2pkcs7 -nocrl -certfile /tmp/certs.pem -out ${f(p.outputFile, "cert.p7b")}`,
      ].join("\n");
    },
  },
  "pkcs12->certDetails": {
    params: [inFile, pw],
    generate: (p) => {
      const passFlag = p.password ? `-passin pass:${p.password}` : "-passin pass:";
      return `openssl pkcs12 -in ${f(p.inputFile, "bundle.p12")} -info -nodes ${passFlag}`;
    },
  },

  // ── PKCS#7 ──
  "pkcs7->pemCert": {
    params: [inFile, outFile],
    generate: (p) =>
      `openssl pkcs7 -in ${f(p.inputFile, "cert.p7b")} -print_certs -out ${f(p.outputFile, "cert.pem")}`,
  },

  // ── Private Key (unencrypted) ──
  "privateKey->publicKey": {
    params: [inFile, outFile],
    generate: (p) =>
      `openssl pkey -in ${f(p.inputFile, "private.key")} -pubout -out ${f(p.outputFile, "public.key")}`,
  },
  "privateKey->encryptedKey": {
    params: [inFile, outFile, outPw],
    generate: (p) => {
      const passFlag = p.outPassword ? `-passout pass:${p.outPassword}` : "";
      return `openssl pkey -in ${f(p.inputFile, "private.key")} -aes256 ${passFlag} -out ${f(p.outputFile, "private.enc.key")}`;
    },
  },
  "privateKey->pkcs8Key": {
    params: [inFile, outFile],
    generate: (p) =>
      `openssl pkcs8 -topk8 -nocrypt -in ${f(p.inputFile, "private.key")} -out ${f(p.outputFile, "private.pkcs8.key")}`,
  },
  "privateKey->csr": {
    params: [inFile, outFile, hash, sanField, cn, org, ou, country, stField, locality, email],
    generate: (p) =>
      `openssl req -new -key ${f(p.inputFile, "private.key")} -${p.hash || "sha256"} -subj ${subjectString(p)}${sanFlags(p.san)} -out ${f(p.outputFile, "request.csr")}`,
  },
  "privateKey->selfSignedFromKey": {
    params: [inFile, outFile, days, hash, sanField, cn, org, ou, country, stField, locality, email],
    generate: (p) =>
      `openssl req -new -x509 -key ${f(p.inputFile, "private.key")} -${p.hash || "sha256"} -days ${f(p.days, "365")} -subj ${subjectString(p)}${sanFlags(p.san)} -out ${f(p.outputFile, "selfsigned.pem")}`,
  },

  // ── Private Key (encrypted) ──
  "encryptedKey->decryptedKey": {
    params: [inFile, outFile, pw],
    generate: (p) => {
      const passFlag = p.password ? `-passin pass:${p.password}` : "";
      return `openssl pkey -in ${f(p.inputFile, "private.enc.key")} ${passFlag} -out ${f(p.outputFile, "private.key")}`;
    },
  },
  "encryptedKey->publicKey": {
    params: [inFile, outFile, pw],
    generate: (p) => {
      const passFlag = p.password ? `-passin pass:${p.password}` : "";
      return `openssl pkey -in ${f(p.inputFile, "private.enc.key")} ${passFlag} -pubout -out ${f(p.outputFile, "public.key")}`;
    },
  },

  // ── CSR ──
  "csr->viewCsr": {
    params: [inFile],
    generate: (p) =>
      `openssl req -in ${f(p.inputFile, "request.csr")} -text -noout -verify`,
  },
  "csr->selfSignedFromCsr": {
    params: [inFile, keyFile, outFile, days, hash],
    generate: (p) =>
      `openssl x509 -req -in ${f(p.inputFile, "request.csr")} -signkey ${f(p.keyFile, "private.key")} -${p.hash || "sha256"} -days ${f(p.days, "365")} -out ${f(p.outputFile, "selfsigned.pem")}`,
  },

  // ── Certificate + Key (separate files) ──
  "certAndKey->pkcs12": {
    params: [inFile, keyFile, outFile, chainFiles, outPw],
    generate: (p) => {
      const passFlag = p.outPassword ? `-passout pass:${p.outPassword}` : "-passout pass:";
      const chainFlag = p.chainFiles ? ` -certfile ${p.chainFiles}` : "";
      return `openssl pkcs12 -export -in ${f(p.inputFile, "cert.pem")} -inkey ${f(p.keyFile, "private.key")}${chainFlag} ${passFlag} -out ${f(p.outputFile, "bundle.p12")}`;
    },
  },
  "certAndKey->keyMatch": {
    params: [inFile, keyFile],
    generate: (p) =>
      [
        `# Compare the modulus of certificate and key — output must match`,
        `openssl x509 -noout -modulus -in ${f(p.inputFile, "cert.pem")} | openssl md5`,
        `openssl pkey -noout -modulus -in ${f(p.keyFile, "private.key")} | openssl md5`,
      ].join("\n"),
  },

  // ── Multiple PEM files ──
  "multiplePem->chainBundle": {
    params: [inFile, intermediateCa, caFile, outFile],
    generate: (p) => {
      const files = [f(p.inputFile, "server.pem")];
      if (p.intermediateCaFile.trim()) files.push(p.intermediateCaFile.trim());
      files.push(f(p.caFile, "rootca.pem"));
      return [
        `# Concatenate certificates in order: leaf → intermediate(s) → root`,
        `cat ${files.join(" \\\n    ")} > ${f(p.outputFile, "fullchain.pem")}`,
      ].join("\n");
    },
  },
  "multiplePem->verifyChain": {
    params: [inFile, caFile],
    generate: (p) =>
      `openssl verify -CAfile ${f(p.caFile, "ca-bundle.pem")} ${f(p.inputFile, "cert.pem")}`,
  },

  // ── Nothing (generate from scratch) ──
  "none->rsaKey": {
    params: [outFile, keySize, pw],
    generate: (p) => {
      const passFlag = p.password ? `-aes256 -passout pass:${p.password}` : "";
      return `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:${p.keySize || "2048"} ${passFlag} -out ${f(p.outputFile, "private.key")}`;
    },
  },
  "none->ecKey": {
    params: [outFile, curve, pw],
    generate: (p) => {
      const passFlag = p.password ? `-aes256 -passout pass:${p.password}` : "";
      return `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:${p.curve || "prime256v1"} ${passFlag} -out ${f(p.outputFile, "private.key")}`;
    },
  },
  "none->csrAndKey": {
    params: [outFile, keyFile, keySize, hash, sanField, cn, org, ou, country, stField, locality, email],
    generate: (p) =>
      `openssl req -new -newkey rsa:${p.keySize || "2048"} -${p.hash || "sha256"} -nodes -keyout ${f(p.keyFile, "private.key")} -subj ${subjectString(p)}${sanFlags(p.san)} -out ${f(p.outputFile, "request.csr")}`,
  },
  "none->selfSigned": {
    params: [outFile, keyFile, days, keySize, hash, sanField, cn, org, ou, country, stField, locality, email],
    generate: (p) =>
      `openssl req -x509 -newkey rsa:${p.keySize || "2048"} -${p.hash || "sha256"} -days ${f(p.days, "365")} -nodes -keyout ${f(p.keyFile, "private.key")} -subj ${subjectString(p)}${sanFlags(p.san)} -out ${f(p.outputFile, "selfsigned.pem")}`,
  },
};

export const getValidTargets = (source: SourceType): readonly TargetType[] =>
  VALID_TARGETS[source] ?? [];

export const getOperationSpec = (
  source: SourceType,
  target: TargetType,
): OperationSpec | null => OPERATIONS[`${source}->${target}`] ?? null;

export const generateCommand = (
  source: SourceType,
  target: TargetType,
  params: CertParams,
): string | null => {
  const spec = getOperationSpec(source, target);
  if (!spec) return null;
  return spec.generate(params);
};

export const DEFAULT_PARAMS: CertParams = {
  inputFile: "",
  outputFile: "",
  keyFile: "",
  caFile: "",
  chainFiles: "",
  intermediateCaFile: "",
  password: "",
  outPassword: "",
  cn: "",
  org: "",
  ou: "",
  country: "",
  state: "",
  locality: "",
  email: "",
  san: "",
  days: "365",
  keySize: "2048",
  curve: "prime256v1",
  hash: "sha256",
};
