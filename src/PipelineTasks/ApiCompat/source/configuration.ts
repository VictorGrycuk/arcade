
import { getVariable, getInput, osType } from 'azure-pipelines-task-lib';
import { join } from 'path'
import min from 'minimist';

export class configuration {
    public subscriptionID: string = "";
    public prefix: string = "";
    public ApiCompatPath: string;
    public parameters:{ [index:string] : {name: string, value: string} } = {
        contractsRootFolder: { name: 'contractsRootFolder', value: '' },
        contractsFileName: { name: 'contractsFileName', value: '' },
        implFolder: { name: 'implFolder', value: '' },
        resolveFx: { name: 'resolveFx', value: '' },
        warnOnIncorrectVersion: { name: 'warnOnIncorrectVersion', value: '' },
        warnOnMissingAssemblies: { name: 'warnOnMissingAssemblies', value: '' },
    }

    constructor() {
        // Check if we are running on an agent
        if (typeof getVariable('Agent.Version') !== 'undefined') {
            this.getParameters(this.getAgentParameter);
        } else {
            this.getParameters(this.getCliParameter);
        }
        
        this.getPrefix();

        this.ApiCompatPath = join(__dirname, 'ApiCompat', 'Microsoft.DotNet.ApiCompat.exe');
    }

    private getPrefix(): void {
        this.prefix = osType() == "Linux" ? "sudo" : "";
    }

    private getParameters(funcGetInput: Function): void {
        Object.keys(this.parameters).forEach((parameterName: string) => {
            this.parameters[parameterName].value = funcGetInput(this.parameters[parameterName].name);
        });
    }

    private getAgentParameter = function(parameter: string): string {
        return getInput(parameter);
    }

    private getCliParameter = function(parameter: string): string {
        return min(process.argv.slice(2))[parameter];
    }
    
}