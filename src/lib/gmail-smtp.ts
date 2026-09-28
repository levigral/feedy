import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect } from "node:tls";

class Smtp {
  private buffer = "";
  private pending: Array<() => void> = [];

  constructor(private socket: Socket) {
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.pending.splice(0).forEach((wake) => wake());
    });
  }

  read(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Gmail did not reply in time.")), 20000);
      const pull = () => {
        const lines = this.buffer.split(/\r\n/);
        if (!this.buffer.endsWith("\r\n")) lines.pop();
        const end = lines.findIndex((line) => /^\d{3} /.test(line));
        if (end < 0) {
          this.pending.push(pull);
          return;
        }
        clearTimeout(timer);
        const reply = lines.slice(0, end + 1).join("\r\n");
        this.buffer = this.buffer.slice(reply.length + 2);
        const code = Number(reply.slice(0, 3));
        if (code >= 400) reject(new Error(reply.replace(/\s+/g, " ").slice(0, 240)));
        else resolve(reply);
      };
      pull();
    });
  }

  async cmd(line: string): Promise<string> {
    this.socket.write(`${line}\r\n`);
    return this.read();
  }
}

function waitFor(socket: Socket, event: "connect" | "secureConnect"): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Could not reach Gmail.")), 20000);
    socket.once(event, () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function sendViaGmail(from: string, password: string, to: string[], subject: string, body: string) {
  const sender = from.trim();
  const recipients = to.map((item) => item.trim()).filter(Boolean);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)) throw new Error("Enter a Gmail address.");
  if (!password.trim()) throw new Error("Paste a Gmail app password.");
  if (!recipients.length || recipients.some((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
    throw new Error("Enter a valid landlord email address.");
  }

  const plain = netConnect({ host: "smtp.gmail.com", port: 587 });
  await waitFor(plain, "connect");
  let smtp = new Smtp(plain);
  await smtp.read();
  await smtp.cmd("EHLO viewingdesk");
  await smtp.cmd("STARTTLS");
  plain.removeAllListeners("data");
  const secure = tlsConnect({ socket: plain, servername: "smtp.gmail.com" });
  await waitFor(secure, "secureConnect");
  smtp = new Smtp(secure);
  await smtp.cmd("EHLO viewingdesk");
  await smtp.cmd("AUTH LOGIN");
  await smtp.cmd(Buffer.from(sender).toString("base64"));
  await smtp.cmd(Buffer.from(password.replace(/\s+/g, "")).toString("base64"));
  await smtp.cmd(`MAIL FROM:<${sender}>`);
  for (const recipient of recipients) await smtp.cmd(`RCPT TO:<${recipient}>`);
  await smtp.cmd("DATA");
  const message = [
    `From: ${sender}`,
    `To: ${recipients.join(", ")}`,
    `Subject: ${subject.replace(/[\r\n]+/g, " ").slice(0, 180)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body.replace(/\r?\n/g, "\r\n").replace(/^\./gm, ".."),
    ".",
  ].join("\r\n");
  secure.write(`${message}\r\n`);
  await smtp.read();
  await smtp.cmd("QUIT").catch(() => undefined);
  secure.end();
}
