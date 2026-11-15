import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { requireSecret } from "../requireSecret.js";

const projectRoot = fileURLToPath(new URL("../../../..", import.meta.url));

const importModuleWithoutSecret = (modulePath, secretName, value) => {
  const env = { ...process.env };
  if (value === undefined) delete env[secretName];
  else env[secretName] = value;

  return spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", `import(${JSON.stringify(modulePath)})`],
    { cwd: projectRoot, env, encoding: "utf8" },
  );
};

describe("required runtime secrets", () => {
  test("OTP service prevents startup when OTP_SECRET is missing", () => {
    const result = importModuleWithoutSecret(
      "./src/modules/auth/otp.service.js",
      "OTP_SECRET",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("OTP_SECRET is required");
  });

  test("AI action service prevents startup when ACTION_SECRET is shorter than 32 characters", () => {
    const result = importModuleWithoutSecret(
      "./src/modules/ai/services/aiAgent.service.js",
      "ACTION_SECRET",
      "too-short",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("ACTION_SECRET is required");
  });

  test.each(["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"])(
    "rejects a missing %s",
    (secretName) => {
      const previousValue = process.env[secretName];
      delete process.env[secretName];
      expect(() => requireSecret(secretName)).toThrow(`${secretName} is required`);
      process.env[secretName] = previousValue;
    },
  );
});
