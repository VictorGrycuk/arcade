import { join } from 'path'
import { getInput, setResult, TaskResult } from 'azure-pipelines-task-lib';
import { execSync } from "child_process";
import { existsSync } from 'fs';

run();

function run(): void {

    // Create ApiCompat path
    const ApiCompatPath = join(__dirname, 'ApiCompat', 'Microsoft.DotNet.ApiCompat.exe');

    // Get the binaries to compare
    const inputFiles: string = getInputFiles();
    
    const command = `"${ ApiCompatPath }" "${ inputFiles }" --impl-dirs "${ getInput('implFolder') }"`;

    if (getInput('failOnIssue') === 'true') {
        console.log(runWithCustomError(command));
    } else {
        console.log(runPlain(command));
    }
}

function getInputFiles(): string {
    const filesName: string[] = [];
    
    getInput('contractsFileName').split(' ').forEach(file => {
        const fullFilePath: string = join(getInput('contractsRootFolder'), file);
        if (existsSync(fullFilePath)) {
            filesName.push(fullFilePath);
        }
    });

    return filesName.join(',');
}

function runPlain(command: string): string {
    return execSync(command).toString();
}

function runWithCustomError(command: string): string {
    command = addOptions(command);
    var result: string = '';
    try {
        result = execSync(command).toString();

        if (!parseMessage(result)) {
            setResult(TaskResult.Failed, 'There were differences between the assemblies');
        }

        return result;
    }
    catch (error) {
        setResult(TaskResult.Failed, `A problem ocurred: ${error.message}`);
        return result;
    }
}

function parseMessage (message: string) {
    return Number((message.split(':'))[1].trim()) === 0;
}

function addOptions(command: string): string{
    command += getInput('resolveFx')? ' --resolve-fx' : '';
    command += getInput('warnOnIncorrectVersion')? ' --warn-on-incorrect-version' : '';
    command += getInput('warnOnMissingAssemblies')? ' --warn-on-missing-assemblies' : '';

    return command;
}
