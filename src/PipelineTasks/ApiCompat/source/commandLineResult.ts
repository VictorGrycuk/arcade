export default class CommandLineResult {
    totalIssues: number;
    body: string;

    constructor( totalIssuesMessage: string, body: string,) {
        this.totalIssues = this.parseMessage(totalIssuesMessage);
        this.body = body;
    }

    private parseMessage(message: string): number {
        return Number((message.split(':'))[1].trim());
    }
}