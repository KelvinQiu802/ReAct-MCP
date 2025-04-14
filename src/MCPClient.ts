import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export default class MCPClient {
    private mcp: Client;
    private command: string;
    private args: string[]
    private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];

    constructor(name: string, command: string, args: string[], version?: string) {
        this.mcp = new Client({ name, version: version || "0.0.1" });
        this.command = command;
        this.args = args;
    }

    public async init() {
        await this.connectToServer();
    }

    public async close() {
        await this.mcp.close();
    }

    public getTools() {
        return this.tools;
    }

    public callTool(name: string, params: Record<string, any>) {
        return this.mcp.callTool({
            name,
            arguments: params,
        });
    }

    private async connectToServer() {
        try {
            console.log(`Attempting to connect to MCP server with command: ${this.command} ${this.args.join(' ')}`);
            this.transport = new StdioClientTransport({
                command: this.command,
                args: this.args,
            });
            
            console.log('Transport created, attempting to connect...');
            await this.mcp.connect(this.transport);
            console.log('Successfully connected to MCP server');

            console.log('Fetching available tools...');
            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                };
            });
            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name)
            );
        } catch (e) {
            console.error("Failed to connect to MCP server: ", e);
            if (e instanceof Error) {
                console.error("Error details:", {
                    message: e.message,
                    stack: e.stack,
                    ...(e as any).data
                });
            }
            throw e;
        }
    }
}