import type { NextConfig } from "next";
import path from "path";

/** Cabeceras que no dependen del entorno (se sirven desde la capa estática). */
const STATIC_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Se aplica en modo report-only: documenta la política objetivo sin romper
  // el render (Next inyecta scripts inline que exigen nonce para enforcing).
  // Pasar a enforcing requiere nonce en middleware y aceptar render dinámico.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "manifest-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ["@redfacyt/shared"],
  // No anunciar el framework en las respuestas.
  poweredByHeader: false,
  /**
   * Cabeceras de seguridad del frontend.
   *
   * HSTS solo en producción: en desarrollo el frontend viaja por HTTP y una
   * cabecera HSTS cacheada por el navegador rompería `localhost`.
   */
  async headers() {
    const headers = [...STATIC_SECURITY_HEADERS];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }
    return [{ source: "/(.*)", headers }];
  },
};

export default nextConfig;
