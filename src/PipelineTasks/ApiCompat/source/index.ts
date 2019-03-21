import { join } from 'path'
import { getInput, setResult, TaskResult } from 'azure-pipelines-task-lib';
import { execSync } from "child_process";
import { existsSync } from 'fs';
import CommandLineResult from './commandLineResult';

run();

function run(): void {
    // Create ApiCompat path
    const ApiCompatPath = join(__dirname, 'ApiCompat', 'Microsoft.DotNet.ApiCompat.exe');
    
    // Show the ApiCompat version
    console.log(execSync(`"${ApiCompatPath}" --version`).toString());
    
    // Get the binaries to compare and create the command to run
    const inputFiles: string = getInputFiles();
    const command = `"${ApiCompatPath}" "${inputFiles}" --impl-dirs "${getInput('implFolder')}" ${getOptions()}`;

    // Run the ApiCompat command
    runCommand(command);
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

function runCommand(command: string): void {
    let result = parseResult(execSync(command).toString());
    
    const compatResult: TaskResult = getCompattibilityResult(result.totalIssues);
    const colorCode: string = getColorCode(result.totalIssues);
    const resultText = result.totalIssues != 0 ?
        `There were ${ result.totalIssues } differences between the assemblies` :
        `No differences were found between the assemblies` ;
    
    console.log(result.body + colorCode + 'Total Issues : ' + result.totalIssues);
    setResult(compatResult, resultText);
}

function getOptions() {
    var command = getInput('resolveFx') ? ' --resolve-fx' : '';
    command += getInput('warnOnIncorrectVersion') ? ' --warn-on-incorrect-version' : '';
    command += getInput('warnOnMissingAssemblies') ? ' --warn-on-missing-assemblies' : '';

    return command;
}

function getCompattibilityResult(totalIssues: number): TaskResult {
    return totalIssues === 0
        ? TaskResult.Succeeded
        : getInput('failOnIssue') === 'true'
            ? TaskResult.Failed
            : TaskResult.SucceededWithIssues;
}

function getColorCode(totalIssues: number): string {
    return totalIssues === 0
        ? "\x1b[32m"
        : getInput('failOnIssue') === 'true'
            ? "\x1b[31m"
            : "\x1b[33m";
}

function parseResult(message: string): CommandLineResult {
    const indexOfResult: number = message.indexOf("Total Issues");
    return new CommandLineResult(message.substring(0, indexOfResult - 1),
        message.substring(indexOfResult));
}
