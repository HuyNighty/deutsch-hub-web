import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const directory = path.resolve("src/pages/study-in-germany/fonts");
const provenance = JSON.parse(readFileSync(path.join(directory, "provenance.json"), "utf8"));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const qualified = [
  { family: "Fraunces", file: "fraunces-normal.woff2", bytes: 195012,
    sha256: "7dc0dd18aeeae3204d5cc26679b5f41d8be1e622bd3bd39fef574346c99508e8",
    license: "fraunces-OFL.txt", licenseBytes: 4391,
    licenseHash: "bdf4c22802eaf804f998195871c6b8938aac2ac14b2d78a8bd66a6f1eced833b",
    commit: "4024282d9b0cffcdb8e3024560862746178d741f" },
  { family: "Manrope", file: "manrope-normal.woff2", bytes: 53892,
    sha256: "30b83738add8c9edd9e3450b98036a9a8fb5668d0cbd4eb0ce5fe6761197f21f",
    license: "manrope-OFL.txt", licenseBytes: 4387,
    licenseHash: "58172e0c0fac2cda8a37b348164bb55e44b0e69051e557e92b1d3f6910141f7b",
    commit: "b31870aff700ab7a1d74fa0c6887d95beb9e0037" },
];

describe("qualified Study Introduction font distribution", () => {
  it.each(qualified)("ships the exact full-repertoire $family binary", expected => {
    const bytes = readFileSync(path.join(directory, expected.file));
    const record = provenance.fonts.find(font => font.family === expected.family);
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("wOF2");
    expect(bytes.length).toBe(expected.bytes);
    expect(sha256(bytes)).toBe(expected.sha256);
    expect(record).toMatchObject({ file: expected.file, bytes: expected.bytes, sha256: expected.sha256,
      style: "normal", source: { distribution_commit: expected.commit } });
    expect(record.source.url).toContain("/" + expected.commit + "/ofl/");
  });

  it.each(qualified)("distributes the complete authenticated $family OFL notice", expected => {
    const record = provenance.fonts.find(font => font.family === expected.family);
    const notice = readFileSync(path.resolve("public/licenses/study-fonts/v1", expected.license));
    expect(notice.length).toBe(expected.licenseBytes);
    expect(sha256(notice)).toBe(expected.licenseHash);
    expect(record.license).toMatchObject({ id: "OFL-1.1", bytes: expected.licenseBytes,
      sha256: expected.licenseHash, file: "public/licenses/study-fonts/v1/" + expected.license });
    expect(notice.toString("utf8")).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });

  it("retains the bounded transformation record and full variable ranges", () => {
    expect(provenance.fonts).toHaveLength(2);
    expect(provenance.combined_font_bytes).toBe(248904);
    expect(provenance.transformation).toMatchObject({ full_repertoire: true, subsetted: false,
      fonttools_version: "4.67.0", brotli_version: "1.1.0",
      fraunces_empty_dsig_exception: { source_sha256: "177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb",
        raw_hex: "0000000100000000", bytes: 8, signature_count: 0, flags: 0 } });
    expect(provenance.fonts[0].axes).toEqual([
      { tag: "opsz", min: 9, default: 9, max: 144 },
      { tag: "wght", min: 100, default: 900, max: 900 },
      { tag: "SOFT", min: 0, default: 0, max: 100 },
      { tag: "WONK", min: 0, default: 1, max: 1 },
    ]);
    expect(provenance.fonts[1].axes).toEqual([{ tag: "wght", min: 200, default: 200, max: 800 }]);
  });
});
