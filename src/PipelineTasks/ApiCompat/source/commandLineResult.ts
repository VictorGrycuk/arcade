export default class CommandLineResult {
    totalIssues: number;
    body: string;

    constructor( body: string, totalIssuesMessage: string) {
        this.totalIssues = this.parseMessage(totalIssuesMessage);
        this.body = body;
    }

    private parseMessage(message: string): number {
        return parseInt(message.split(':')[1].trim(), 10);
    }
}
