const { spawn } = require("child_process");
const dotenv = require("dotenv");

dotenv.config();

const connection = process.env.WebPubSubConnectionString;

if (!connection) {
    console.error("WebPubSubConnectionString is not set. Please check your .env file.");
    process.exit(1);
}

const cmd = "sh";
const args = ["-c", `export WebPubSubConnectionString='${connection}' && node server`];

const subprocess = spawn(cmd, args, { stdio: "inherit" });

subprocess.on("error", (error) => {
    console.error(`Error: ${error}`);
});

subprocess.on("exit", (code) => {
    console.log(`Exited with code ${code}`);
});
