const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const port = Number(process.env.PORT) || 3000;
const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
let proxy = null;
let stopped = false;

function closeProxy() {
    if (!proxy) return;
    try {
        proxy.close();
    } catch (error) {
        console.error("dev-server.proxy.close.failed", error);
    }
    proxy = null;
}

function stop(code) {
    if (stopped) return;
    stopped = true;
    closeProxy();
    process.exit(code ?? 0);
}

const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
        env: process.env
    }
);

child.on("error", (error) => {
    console.error("dev-server.next.spawn.failed", error);
    stop(1);
});

child.on("exit", (code, signal) => {
    if (signal) console.error("dev-server.next.exited", signal);
    stop(code ?? (signal ? 1 : 0));
});

function bindIpv6Proxy() {
    proxy = net.createServer((client) => {
        const upstream = net.connect({ port, host: "127.0.0.1" });
        const closeBoth = () => {
            client.destroy();
            upstream.destroy();
        };
        upstream.on("error", closeBoth);
        client.on("error", closeBoth);
        client.on("close", () => upstream.destroy());
        upstream.on("close", () => client.destroy());
        upstream.on("connect", () => {
            client.pipe(upstream);
            upstream.pipe(client);
        });
    });
    proxy.on("error", (error) => {
        console.error("dev-server.ipv6-proxy.failed", error && error.message ? error.message : error);
    });
    proxy.listen(port, "::1", () => {
        console.log(`IPv6 localhost proxy ready on [::1]:${port}`);
    });
}

function waitForIpv4() {
    if (stopped) return;
    const probe = net.connect({ port, host: "127.0.0.1" });
    probe.once("connect", () => {
        probe.end();
        try {
            bindIpv6Proxy();
        } catch (error) {
            console.error("dev-server.ipv6-proxy.start.failed", error);
        }
    });
    probe.once("error", () => {
        setTimeout(waitForIpv4, 400);
    });
}

waitForIpv4();

function forwardStop(signal) {
    try {
        child.kill(signal);
    } catch (error) {
        console.error("dev-server.next.stop.failed", error);
        stop(1);
    }
}

process.on("SIGINT", () => forwardStop("SIGINT"));
process.on("SIGTERM", () => forwardStop("SIGTERM"));
