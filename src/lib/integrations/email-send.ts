import type { EmailIntegrationConfig } from "@/lib/integrations/config-types";
import { getResendApiKey } from "@/lib/config/env";

export async function sendEmailMessage(
  config: EmailIntegrationConfig,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string }> {
  if (config.provider === "resend") {
    const apiKey = config.api_key ?? getResendApiKey();
    if (!apiKey) throw new Error("API key de Resend no configurada");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from_name
          ? `${config.from_name} <${config.from_email}>`
          : config.from_email,
        to: [to],
        subject,
        text: body,
      }),
    });

    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) throw new Error(json.message ?? `Resend error ${res.status}`);
    if (!json.id) throw new Error("Resend no devolvió ID");
    return { id: json.id };
  }

  throw new Error("SMTP aún no implementado. Usá Resend como proveedor.");
}
