/* VIPER 2026 — ML-KEM *slot*.
   FIPS 203 is the name. This file does not contain Kyber polynomials. */
const MLKEM = (() => {
  const STD = "FIPS 203 ML-KEM — not implemented in-browser; slot only";
  async function encapsulate(label) {
    const seed = crypto.getRandomValues(new Uint8Array(32));
    const hex = [...seed].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { standard: STD, kem: "SLOT", label: label || "session", seed: hex.slice(0, 16) + "…", note: "replace with liboqs ML-KEM-768" };
  }
  function paint() {
    const el = document.getElementById("mlkemPane");
    if (el) el.textContent = STD;
  }
  return { encapsulate, paint, STD };
})();
