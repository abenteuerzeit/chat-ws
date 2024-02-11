const { spawn } = require("child_process");
const dotenv = require("dotenv");

dotenv.config();

const connection = process.env.WebPubSubConnectionString;

if (!connection) {
    console.error("WebPubSubConnectionString is not set. Please check your .env file.");
    process.exit(1);
}

const isPowerShell = process.env.PSModulePath !== undefined;

let command;
let args;

if (isPowerShell) {
    command = "powershell.exe";
    args = [`$env:WebPubSubConnectionString='${connection}';`, "node", "server"];
} else if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/c", `set "WebPubSubConnectionString=${connection}" && node server`];
} else {
    console.error("This script only supports PowerShell and Command Prompt on Windows.");
    process.exit(1);
}

const subprocess = spawn(command, args, { stdio: "inherit" });

subprocess.on("error", (error) => {
    console.error(`Error: ${error}`);
});

subprocess.on("exit", (code) => {
    console.log(`Exited with code ${code}`);
});
