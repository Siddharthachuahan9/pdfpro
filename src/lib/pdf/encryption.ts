/**
 * Real PDF password encryption / decryption, done in the browser with
 * @cantoo/pdf-lib (a maintained pdf-lib fork with a standard security handler).
 *
 * Protect: AES-256 (PDF 2.0 / ISO 32000-2 revision 6), opens in Acrobat 9+,
 * macOS Preview, Chrome, Firefox and other current viewers.
 * Unlock: accepts RC4-40/128, AES-128 and AES-256 encrypted files.
 */

export class PDFPasswordError extends Error {
  constructor(
    message: string,
    public code: "not-encrypted" | "password-required" | "wrong-password" | "unreadable"
  ) {
    super(message);
    this.name = "PDFPasswordError";
  }
}

async function lib() {
  return import("@cantoo/pdf-lib");
}

const ALL_PERMISSIONS = {
  printing: "highResolution" as const,
  modifying: true,
  copying: true,
  annotating: true,
  fillingForms: true,
  contentAccessibility: true,
  documentAssembly: true,
};

export const ENCRYPTION_LABEL = "AES-256";

/** Encrypt a PDF so it needs `password` to open. */
export async function encryptPDF(file: File, password: string): Promise<Uint8Array> {
  if (!password) throw new Error("A password is required.");
  const { PDFDocument } = await lib();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const probe = await loadOrThrow(PDFDocument, bytes, { ignoreEncryption: true });
  if (probe.isEncrypted) {
    throw new PDFPasswordError(
      "This PDF is already password-protected. Unlock it first, then protect it with a new password.",
      "unreadable"
    );
  }

  const doc = await loadOrThrow(PDFDocument, bytes, {});
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: ALL_PERMISSIONS,
    algorithm: "AES-256",
  });
  return doc.save();
}

/** Returns whether a PDF is encrypted, and whether it opens without a password. */
export async function inspectEncryption(
  file: File
): Promise<{ encrypted: boolean; needsPassword: boolean }> {
  const { PDFDocument } = await lib();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const probe = await loadOrThrow(PDFDocument, bytes, { ignoreEncryption: true });
  if (!probe.isEncrypted) return { encrypted: false, needsPassword: false };
  try {
    await PDFDocument.load(bytes, { password: "", updateMetadata: false });
    return { encrypted: true, needsPassword: false };
  } catch {
    return { encrypted: true, needsPassword: true };
  }
}

/**
 * Remove encryption. Files that only have an owner password (restrictions but
 * no open password) unlock without a password.
 */
export async function decryptPDF(file: File, password: string): Promise<Uint8Array> {
  const { PDFDocument } = await lib();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const probe = await loadOrThrow(PDFDocument, bytes, { ignoreEncryption: true });
  if (!probe.isEncrypted) {
    throw new PDFPasswordError("This PDF is not password-protected.", "not-encrypted");
  }

  // Owner-password-only files open with the empty user password.
  try {
    const doc = await PDFDocument.load(bytes, { password: "", updateMetadata: false });
    return doc.save();
  } catch {
    /* needs a real password */
  }

  if (!password) {
    throw new PDFPasswordError("This PDF needs a password to open. Enter it above.", "password-required");
  }

  let doc;
  try {
    doc = await PDFDocument.load(bytes, { password, updateMetadata: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/password/i.test(msg)) {
      throw new PDFPasswordError("Incorrect password. Check it and try again.", "wrong-password");
    }
    throw new PDFPasswordError(
      "This PDF uses an encryption method that can't be opened here.",
      "unreadable"
    );
  }
  return doc.save();
}

type PDFDocumentCtor = Awaited<ReturnType<typeof lib>>["PDFDocument"];

async function loadOrThrow(
  PDFDocument: PDFDocumentCtor,
  bytes: Uint8Array,
  opts: { ignoreEncryption?: boolean }
) {
  try {
    return await PDFDocument.load(bytes, { ...opts, updateMetadata: false });
  } catch (err) {
    if (err instanceof Error && /encrypt/i.test(err.message)) throw err;
    throw new PDFPasswordError("This file couldn't be read as a PDF.", "unreadable");
  }
}
